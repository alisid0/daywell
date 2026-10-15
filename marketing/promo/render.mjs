// Renders a film's index.html (a seek(t) film) with system Chrome over the DevTools protocol, and encodes with FFmpeg.
// Serves the whole promo folder, so the shorts can share the engine, mascots, fonts and sound effects.
//   node render.mjs [--film=shorts/eat] --stills=1.5,12,19.4   PNG stills at those seconds → <film>/out/stills/t012.00.png …
//   node render.mjs [--film=shorts/eat] --cues                  writes <film>/data/cues.json (sound cues, for tools/mix.mjs)
//   node render.mjs [--film=shorts/eat] [--fps=60] [--from=0 --to=120] [--name=…]
//                                              the film → <film>/out/<name>.mp4 (never overwrites: adds -b, -c …),
//                                              with <film>/audio/mix.wav as its sound when it exists
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { FFMPEG } from "./tools/ffmpeg-path.mjs";
import { CHROME, TMP, promoRoot, filmRoot, filmPath, film } from "./tools/paths.mjs";

const root = promoRoot;
const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split("=")[1];
const has = name => process.argv.includes(`--${name}`);
const stills = arg("stills")?.split(",").map(Number);
const fps = Number(arg("fps") || 60), from = Number(arg("from") || 0);
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Stills and cues run in their own slot (ports and Chrome profile), so they can run while a full render does;
// RENDER_SLOT=2, 3 … lets more full renders run side by side.
const slot = Number(process.env.RENDER_SLOT ?? (stills || has("cues") ? 1 : 0));
const exists = async p => { try { await stat(p); return true; } catch { return false; } };

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".json": "application/json" };
const server = createServer(async (req, res) => {
  try {
    const path = normalize(join(root, decodeURIComponent(new URL(req.url, "http://local").pathname)));
    if (!path.startsWith(normalize(root))) throw new Error("outside");
    const body = await readFile(path);
    res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(8791 + slot, "127.0.0.1", r));

const port = 9371 + slot;
const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${join(TMP, `render-${slot}`)}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--force-color-profile=srgb", "--disable-gpu-vsync", "--window-size=1080,1920", "about:blank"], { stdio: "ignore" });
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === "page"); } catch { /* starting */ } }
if (!target) throw new Error("Chrome did not start");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(); const listeners = [];
ws.addEventListener("message", ({ data }) => { const msg = JSON.parse(data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } else if (msg.method) listeners.forEach(l => l(msg)); });
const send = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
const once = method => new Promise(resolve => { const l = msg => { if (msg.method === method) { listeners.splice(listeners.indexOf(l), 1); resolve(msg); } }; listeners.push(l); });
const evaluate = async expression => {
  const reply = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (reply.result?.exceptionDetails) throw new Error(JSON.stringify(reply.result.exceptionDetails).slice(0, 600));
  return reply.result?.result?.value;
};
await send("Page.enable"); await send("Runtime.enable");
listeners.push(msg => { if (msg.method === "Runtime.exceptionThrown") console.error("page error:", msg.params.exceptionDetails?.exception?.description?.slice(0, 300)); });
listeners.push(msg => { if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) console.error(`page ${msg.params.type}:`, msg.params.args.map(a => a.value ?? a.description).join(" ").slice(0, 300)); });
await send("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
const loaded = once("Page.loadEventFired");
await send("Page.navigate", { url: `http://127.0.0.1:${8791 + slot}/${filmPath ? `${filmPath}/` : ""}index.html` });
await loaded;
const duration = await evaluate("window.ready.then(() => window.duration)");
console.log("film length", duration);
const to = Number(arg("to") || duration);
const frameAt = t => evaluate(`seek(${t.toFixed(5)}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);

if (has("cues")) {
  const cues = await evaluate("window.cues");
  await mkdir(join(filmRoot, "data"), { recursive: true });
  await writeFile(join(filmRoot, "data", "cues.json"), JSON.stringify(cues, null, 1));
  console.log("cues", cues.length);
} else if (stills) {
  await mkdir(join(filmRoot, "out", "stills"), { recursive: true });
  for (const t of stills) {
    await frameAt(t);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(join(filmRoot, "out", "stills", `t${t.toFixed(2).padStart(6, "0")}.png`), Buffer.from(shot.result.data, "base64"));
  }
  console.log("stills", stills.length);
} else {
  await mkdir(join(filmRoot, "out"), { recursive: true });
  const base = arg("name") || film.name;
  let out = join(filmRoot, "out", `${base}.mp4`), n = 0;
  while (await exists(out)) out = join(filmRoot, "out", `${base}-${String.fromCharCode(98 + n++)}.mp4`);
  const mix = join(filmRoot, "audio", "mix.wav"), withSound = await exists(mix);
  const args = ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "pipe:0"];
  if (withSound) args.push("-ss", String(from), "-i", mix);
  args.push("-map", "0:v");
  if (withSound) args.push("-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-ar", "48000");
  args.push("-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-profile:v", "high",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv", "-r", String(fps), "-t", String(to - from), "-movflags", "+faststart", out);
  const ff = spawn(FFMPEG, args, { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((resolve, reject) => ff.on("close", code => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`)))));
  const started = Date.now(), total = Math.round((to - from) * fps);
  for (let f = 0; f < total; f++) {
    await frameAt(from + f / fps);
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 94, optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(shot.result.data, "base64"))) await new Promise(r => ff.stdin.once("drain", r));
    if (f % (fps * 10) === 0) console.log(`frame ${f}/${total}, ${Math.round((Date.now() - started) / 1000)} s`);
  }
  ff.stdin.end();
  await done;
  console.log("wrote", out, withSound ? "with mix.wav" : "without sound", `in ${Math.round((Date.now() - started) / 1000)} s`);
}
await send("Browser.close").catch(() => {});
ws.close(); proc.kill(); server.close();
process.exit(0);
