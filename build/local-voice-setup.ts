import { randomUUID } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import type { Plugin } from "vite";

const endpoint = "/__daywell/local-voice-setup";
const hosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
const addresses = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const keyPattern = /^[a-zA-Z0-9_-]{16,256}$/;
const agentPattern = /^[a-zA-Z0-9_-]{5,100}$/;

function reply(response: ServerResponse, status: number, body: object) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(body));
}

async function readSettings(path: string) {
  try { return await readFile(path, "utf8"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

function savedStatus(settings: string) {
  return {
    available: true,
    keySaved: /^\s*ELEVENLABS_API_KEY\s*=\s*["']?[a-zA-Z0-9_-]{16,256}["']?\s*$/m.test(settings),
    agentSaved: /^\s*ELEVENLABS_AGENT_ID\s*=\s*["']?[a-zA-Z0-9_-]{5,100}["']?\s*$/m.test(settings),
  };
}

export function createVoiceSetupHandler(root: string, secure = false) {
  const path = resolve(root, ".dev.vars");
  let saving = false;
  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if ((request.url ?? "").split("?")[0] !== endpoint) return next();
    // The sites plugin runs first: it removes supplied identity headers and only
    // adds this local identity for a signed-in loopback request.
    let origin: string;
    try {
      const authority = new URL(`${secure ? "https" : "http"}://${request.headers.host}`);
      if (!hosts.has(authority.hostname) || !addresses.has(request.socket.remoteAddress ?? "")) throw new Error();
      origin = authority.origin;
    } catch { return reply(response, 403, { error: "Open setup on this computer." }); }
    if (request.headers["oai-authenticated-user-id"] !== "local_seedy") return reply(response, 401, { error: "Sign in to Daywell first." });
    if (request.headers["sec-fetch-site"] === "cross-site" || (request.headers.origin && request.headers.origin !== origin)) return reply(response, 403, { error: "Save your key from the Daywell setup page." });

    if (request.method === "GET") {
      try { return reply(response, 200, savedStatus(await readSettings(path))); }
      catch { return reply(response, 500, { error: "Could not check local settings." }); }
    }
    if (request.method !== "POST") return reply(response, 405, { error: "Use the Save key button." });
    if (request.headers.origin !== origin || request.headers["content-type"]?.split(";")[0].trim() !== "application/json") return reply(response, 403, { error: "Save your key from the Daywell setup page." });
    if (saving) return reply(response, 409, { error: "A save is already in progress. Try again shortly." });
    saving = true;
    let temporary: string | undefined;
    try {
      let body = "";
      for await (const chunk of request) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 4096) return reply(response, 413, { error: "The pasted value is too long." });
      }
      let value: { apiKey?: unknown; agentId?: unknown };
      try {
        value = JSON.parse(body);
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
      } catch { return reply(response, 400, { error: "Enter your key in the form and try again." }); }
      const key = typeof value.apiKey === "string" ? value.apiKey.trim() : "";
      const agentId = typeof value.agentId === "string" ? value.agentId.trim() : "";
      if ((!key && !agentId) || (key && !keyPattern.test(key)) || (agentId && !agentPattern.test(agentId))) return reply(response, 400, { error: "Check the key and agent ID, then paste them again. Nothing was saved." });
      const existing = await readSettings(path);
      const kept = existing.split(/\r?\n/).filter(line =>
        !(key && /^\s*ELEVENLABS_API_KEY\s*=/.test(line)) &&
        !(agentId && /^\s*ELEVENLABS_AGENT_ID\s*=/.test(line))
      ).join("\n").trimEnd();
      const updated = `${kept}${kept ? "\n" : ""}${key ? `ELEVENLABS_API_KEY=${key}\n` : ""}${agentId ? `ELEVENLABS_AGENT_ID=${agentId}\n` : ""}`;
      temporary = `${path}.daywell-${randomUUID()}`;
      await writeFile(temporary, updated, { encoding: "utf8", mode: 0o600, flag: "wx" });
      await rename(temporary, path);
      temporary = undefined;
      return reply(response, 200, { ...savedStatus(updated), saved: true });
    } catch {
      // Never include request data, file contents or provider errors in output.
      return reply(response, 500, { error: "Could not save. Paste your key again and retry." });
    } finally {
      if (temporary) await unlink(temporary).catch(() => {});
      saving = false;
    }
  };
}

export function localVoiceSetup({ enabled = true } = {}): Plugin {
  return {
    name: "daywell-local-voice-setup",
    apply: "serve",
    config() {
      // Also block direct Vite file URLs, including temporary secret files.
      return { server: { fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.dev.vars*"] } } };
    },
    configureServer(server) {
      if (!enabled) return;
      server.middlewares.use(createVoiceSetupHandler(server.config.root, Boolean(server.config.server.https)));
    },
  };
}
