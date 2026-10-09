import test from "node:test";
import assert from "node:assert/strict";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { handlePrivateCloudflareRequest } from "../lib/cloudflare-access.ts";
import { servePrivateAssets } from "../lib/cloudflare-assets.ts";

const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = { ...await exportJWK(publicKey), kid: "test", alg: "RS256", use: "sig" };
const keys = createLocalJWKSet({ keys: [jwk] });
const env = {
  CF_ACCESS_ISSUER: "https://daywell-test.cloudflareaccess.com",
  CF_ACCESS_AUD: "a".repeat(64),
  DAYWELL_APP_ORIGIN: "https://daywell-test.workers.dev",
};
const defaults = { iss: env.CF_ACCESS_ISSUER, aud: [env.CF_ACCESS_AUD], sub: "person-one", email: "one@test.invalid", type: "app" };
async function sign(overrides = {}, signingKey = privateKey) {
  return new SignJWT({ ...defaults, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 600, ...overrides })
    .setProtectedHeader({ alg: "RS256", kid: "test" }).sign(signingKey);
}
function request(token, path = "/api/state", headers = {}, method = "GET", body) {
  return new Request(`${env.DAYWELL_APP_ORIGIN}${path}`, { method, body, headers: { ...(token ? { "cf-access-jwt-assertion": token } : {}), ...headers } });
}
async function inspect(req, config = env, resolver = keys) {
  let received;
  const response = await handlePrivateCloudflareRequest(req, config, async (forwarded) => {
    received = forwarded;
    return new Response("private record", { headers: { "Cache-Control": "public, max-age=300" } });
  }, resolver);
  return { received, response };
}

test("private hosting rejects unauthenticated requests including mock cookie and spoofed identity", async () => {
  for (const path of ["/", "/api/state", "/api/food", "/api/voice", "/api/capture", "/assets/app.js"]) {
    const { received, response } = await inspect(request(null, path, { cookie: "__sites_local_auth=1", "oai-authenticated-user-id": "victim", "oai-authenticated-user-email": "victim@test.invalid" }));
    assert.equal(response.status, 401);
    assert.equal(received, undefined);
  }
});

test("valid Access identity replaces every untrusted identity header and preserves request body", async () => {
  const { received, response } = await inspect(request(await sign(), "/api/state", {
    "oai-authenticated-user-id": "victim", "oai-authenticated-user-email": "victim@test.invalid",
    "oai-authenticated-user-full-name": "Pretend Owner", "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    "Content-Type": "application/json", Origin: env.DAYWELL_APP_ORIGIN,
  }, "POST", '{"value":"my record"}'));
  assert.equal(response.status, 200);
  assert.match(received.headers.get("oai-authenticated-user-id"), /^cf-access:[a-f0-9]{64}$/);
  assert.equal(received.headers.get("oai-authenticated-user-email"), "one@test.invalid");
  assert.equal(received.headers.get("oai-authenticated-user-full-name"), null);
  assert.equal(received.headers.get("oai-authenticated-user-full-name-encoding"), null);
  assert.equal(received.headers.get("cf-access-jwt-assertion"), null);
  assert.equal(received.headers.get("origin"), env.DAYWELL_APP_ORIGIN);
  assert.equal(await received.text(), '{"value":"my record"}');
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("identity stays stable for email changes and separates users and Access teams", async () => {
  async function id(claims, settings = env) {
    return (await inspect(request(await sign(claims)), settings)).received.headers.get("oai-authenticated-user-id");
  }
  const first = await id({});
  assert.equal(first, await id({ email: "renamed@test.invalid" }));
  assert.notEqual(first, await id({ sub: "person-two" }));
  const issuer = "https://another-team.cloudflareaccess.com";
  assert.notEqual(first, await id({ iss: issuer }, { ...env, CF_ACCESS_ISSUER: issuer }));
});

test("rejects wrong issuer/audience, expired/future/missing claims and non-person tokens", async () => {
  const now = Math.floor(Date.now() / 1000);
  for (const override of [
    { iss: "https://attacker.cloudflareaccess.com" }, { aud: ["b".repeat(64)] },
    { exp: now - 10 }, { exp: undefined }, { iat: undefined }, { iat: now + 300 }, { nbf: now + 300 },
    { sub: "" }, { sub: undefined }, { email: undefined }, { email: "bad\r\nheader@test.invalid" }, { type: "service" }, { type: undefined },
  ]) {
    const { response, received } = await inspect(request(await sign(override)));
    assert.equal(response.status, 401, JSON.stringify(override));
    assert.equal(received, undefined);
  }
  const forged = await generateKeyPair("RS256");
  assert.equal((await inspect(request(await sign({}, forged.privateKey)))).response.status, 401);
  for (const token of ["invalid.jwt", "x".repeat(16_385)]) assert.equal((await inspect(request(token))).response.status, 401);
  const hsToken = await new SignJWT(defaults).setProtectedHeader({ alg: "HS256" }).sign(new TextEncoder().encode("a".repeat(64)));
  assert.equal((await inspect(request(hsToken))).response.status, 401);
});

test("configuration, origin and local setup fail closed without calling the application", async () => {
  const token = await sign();
  for (const config of [{}, { ...env, CF_ACCESS_AUD: "" }, { ...env, CF_ACCESS_ISSUER: "https://attacker.invalid" }, { ...env, DAYWELL_APP_ORIGIN: "http://localhost" }]) {
    assert.equal((await inspect(request(token), config)).response.status, 503);
  }
  assert.equal((await inspect(new Request("https://alternate.workers.dev/", { headers: { "cf-access-jwt-assertion": token } }))).response.status, 403);
  const blocked = await inspect(request(token, "/__daywell/local-voice-setup"));
  assert.equal(blocked.response.status, 404);
  assert.equal(blocked.received, undefined);
  const unavailable = await inspect(request(token), env, async () => { throw new Error("JWKS unavailable"); });
  assert.equal(unavailable.response.status, 401);
  assert.equal(unavailable.received, undefined);
});

test("sign-in redirects stay on Daywell and sign-out uses the Access logout endpoint", async () => {
  const token = await sign();
  for (const target of ["https://evil.invalid", "//evil.invalid", "/\\evil.invalid", "/signin-with-chatgpt", "/cdn-cgi/access/logout"]) {
    const { response, received } = await inspect(request(token, `/signin-with-chatgpt?return_to=${encodeURIComponent(target)}`));
    assert.equal(response.headers.get("location"), `${env.DAYWELL_APP_ORIGIN}/`);
    assert.equal(received, undefined);
  }
  const valid = await inspect(request(token, "/signin-with-chatgpt?return_to=%2Feat%3Ftab%3Dbasket"));
  assert.equal(valid.response.headers.get("location"), `${env.DAYWELL_APP_ORIGIN}/eat?tab=basket`);
  const logout = await inspect(request(token, "/signout-with-chatgpt"));
  assert.equal(logout.response.headers.get("location"), `${env.CF_ACCESS_ISSUER}/cdn-cgi/access/logout`);
});

test("production CSS and audio are served after authentication with their types and range headers intact", async () => {
  let assetReads = 0;
  const assets = { async fetch(req) {
    assetReads++;
    assert.equal(req.headers.get("cf-access-jwt-assertion"), null);
    assert.match(req.headers.get("oai-authenticated-user-id"), /^cf-access:/);
    if (req.url.endsWith(".mp3")) {
      assert.equal(req.headers.get("range"), "bytes=0-3");
      return new Response("MP3!", { status: 206, headers: { "Content-Type": "audio/mpeg", "Content-Range": "bytes 0-3/100", "Cache-Control": "public" } });
    }
    return new Response("body{color:green}", { headers: { "Content-Type": "text/css", "Cache-Control": "public" } });
  } };
  const dynamic = async () => { assert.fail("Existing build assets must not reach the framework's 404 route"); };
  const route = req => servePrivateAssets(req, assets, dynamic);
  const denied = await handlePrivateCloudflareRequest(request(null, "/_next/static/app.css"), env, route, keys);
  assert.equal(denied.status, 401);
  assert.equal(assetReads, 0);
  const css = await handlePrivateCloudflareRequest(request(await sign(), "/_next/static/app.css"), env, route, keys);
  assert.equal(css.status, 200);
  assert.equal(css.headers.get("Content-Type"), "text/css");
  assert.equal(css.headers.get("Cache-Control"), "private, no-store");
  assert.match(await css.text(), /color:green/);
  const audio = await handlePrivateCloudflareRequest(request(await sign(), "/guided-audio/calm.mp3", { range: "bytes=0-3" }), env, route, keys);
  assert.equal(audio.status, 206);
  assert.equal(audio.headers.get("Content-Range"), "bytes 0-3/100");
  assert.equal(audio.headers.get("Content-Type"), "audio/mpeg");
});

test("missing assets reach dynamic pages, while API and write requests bypass asset lookup", async () => {
  let reads = 0;
  const assets = { async fetch() { reads++; return new Response("missing", { status: 404 }); } };
  const next = async req => new Response(`dynamic:${req.method}:${new URL(req.url).pathname}`);
  const page = await servePrivateAssets(request(null, "/eat"), assets, next);
  assert.equal(await page.text(), "dynamic:GET:/eat");
  assert.equal(reads, 1);
  const api = await servePrivateAssets(request(null, "/api/state"), assets, next);
  assert.equal(await api.text(), "dynamic:GET:/api/state");
  await servePrivateAssets(request(null, "/eat", {}, "POST", "test"), assets, next);
  assert.equal(reads, 1);
});
