// Captures real Daywell screens from the preview harness (port 5196, ?promo=1 sample week) at phone size,
// following scripted steps, and records the box of every control the film's finger will touch.
//   node tools/capture.mjs [--film=shorts/eat] [shot names, comma separated]   capture shots from the film's capture-plan.mjs
//   node tools/capture.mjs [--film=…] --explore <query> [steps json] [WxH]      list visible controls after steps
// Output: <film>/assets/shots/<name>.png (780×1688, i.e. 390×844 at 2×) and shots.json (boxes in CSS px).
// A plan group can set `viewport: { width, height, scale, mobile }` (a laptop-sized capture, say) and `base` (another
// page than the harness).
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { CHROME, TMP, filmRoot, filmFile, args } from "./paths.mjs";

const outDir = join(filmRoot, "assets", "shots");
mkdirSync(outDir, { recursive: true });
const chrome = CHROME;
const port = 9362, harness = process.env.HARNESS || "http://localhost:5196/"; // HARNESS=http://localhost:5194/ for another preview
let base = harness;
const PHONE = { width: 390, height: 844, scale: 2, mobile: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${join(TMP, "capture")}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--force-color-profile=srgb", "--autoplay-policy=no-user-gesture-required", "--mute-audio", "about:blank"], { stdio: "ignore" });
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === "page"); } catch { /* starting */ } }
if (!target) { proc.kill(); throw Error("Chrome did not start"); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(), listeners = [];
ws.addEventListener("message", ({ data }) => { const m = JSON.parse(data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) listeners.forEach(l => l(m)); });
const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const once = method => new Promise(res => { const l = m => { if (m.method === method) { listeners.splice(listeners.indexOf(l), 1); res(m); } }; listeners.push(l); });
const evaluate = async expression => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500));
  return r.result?.result?.value;
};
await send("Page.enable"); await send("Runtime.enable"); await send("DOM.enable");
listeners.push(m => { if (m.method === "Runtime.exceptionThrown") console.error("page error:", m.params.exceptionDetails?.exception?.description?.slice(0, 200)); });
let viewportNow = null;
async function setViewport(v = PHONE) {
  if (JSON.stringify(v) === JSON.stringify(viewportNow)) return;
  await send("Emulation.setDeviceMetricsOverride", { width: v.width, height: v.height, deviceScaleFactor: v.scale ?? 2, mobile: v.mobile ?? false });
  await send("Emulation.setTouchEmulationEnabled", { enabled: !!v.mobile, maxTouchPoints: v.mobile ? 5 : 1 });
  viewportNow = v;
}
await setViewport();

// In-page helpers: find a visible element by text or selector, click it, type into it, measure it.
const helpers = `
window.__vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight * 3; };
window.__find = (q, anywhere) => {
  const vis = anywhere ? (el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) : __vis;
  if (q.startsWith('css=')) return [...document.querySelectorAll(q.slice(4))].find(vis) || null;
  const exact = q.startsWith('=') ; const text = (exact ? q.slice(1) : q).toLowerCase();
  const all = [...document.querySelectorAll('button, a, [role=button], [role=tab], label, input, textarea, select, summary, h1, h2, h3, p, span, strong, li')].filter(vis);
  const match = el => { const t = (el.innerText || el.value || el.getAttribute('aria-label') || el.placeholder || '').trim().toLowerCase(); return exact ? t === text : t.includes(text); };
  const hits = all.filter(match);
  return hits.find(el => el.matches('button, a, [role=button], [role=tab], input, textarea, select, summary')) || hits.sort((a, b) => (a.innerText||'').length - (b.innerText||'').length)[0] || null;
};
window.__box = el => { const r = el.getBoundingClientRect(); return { x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
window.__type = (el, text) => { const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); try { el.setSelectionRange(text.length, text.length); } catch {} el.scrollLeft = el.scrollWidth; };
true;`;

async function runSteps(steps, boxes) {
  for (const step of steps) {
    const [kind, arg, extra] = step;
    if (kind === "wait") await sleep(arg);
    else if (kind === "helpers") await evaluate(helpers); // after a page reloads itself, so __find and friends exist again
    else if (kind === "eval") await evaluate(arg);
    else if (kind === "print") console.log("print:", JSON.stringify(await evaluate(arg)));
    else if (kind === "scroll") await evaluate(`(() => { const el = __find(${JSON.stringify(arg)}, true); if (!el) throw Error('not found: ' + ${JSON.stringify(arg)}); el.scrollIntoView({ block: ${JSON.stringify(extra || "center")}, behavior: 'instant' }); return true; })()`);
    else if (kind === "scrollTo") await evaluate(`window.scrollTo(0, ${Number(arg)}); true`);
    // Scroll the page so the element's top sits at a chosen height in the viewport.
    else if (kind === "scrollY") await evaluate(`(() => { const el = __find(${JSON.stringify(arg)}, true); if (!el) throw Error('not found: ' + ${JSON.stringify(arg)}); window.scrollBy(0, el.getBoundingClientRect().top - ${Number(extra)}); return true; })()`);
    else if (kind === "select") await evaluate(`(() => { const el = __find(${JSON.stringify(arg)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(extra)}); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    // Record any element's box under a name without clicking it.
    else if (kind === "boxAs") { const r = await evaluate(`(() => { const el = __find(${JSON.stringify(arg)}); return el ? __box(el) : null; })()`); if (!r) throw Error(`not found: ${arg}`); boxes[extra] = r; }
    else if (kind === "boxMaybe") { const r = await evaluate(`(() => { const el = __find(${JSON.stringify(arg)}); return el ? __box(el) : null; })()`); if (r) boxes[extra] = r; }
    // Tag the smallest element whose text matches a pattern (e.g. a running clock), so it can be measured.
    else if (kind === "tag") await evaluate(`(() => { const re = new RegExp(${JSON.stringify(arg)}); const hits = [...document.querySelectorAll('body *')].filter(e => __vis(e) && re.test((e.innerText || '').trim())); hits.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height); if (!hits[0]) throw Error('no match ' + re); hits[0].setAttribute('data-promo', ${JSON.stringify(extra)}); return true; })()`);
    // A running clock: crops of an element once a second, so the film's timers really tick.
    else if (kind === "tickShots") {
      const [, query, count, cropName, pad = 4] = step;
      const box = await evaluate(`(() => { const el = __find(${JSON.stringify(query)}); return el ? __box(el) : null; })()`);
      if (!box) throw Error(`not found: ${query}`);
      const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + pad * 2, height: box.h + pad * 2, scale: 1 };
      // captureScreenshot clips in page coordinates; the boxes are viewport coordinates.
      const scroll = await evaluate("[scrollX, scrollY]"); const pageClip = { ...clip, x: clip.x + scroll[0], y: clip.y + scroll[1] };
      for (let i = 0; i < count; i++) {
        if (i) await sleep(1000);
        const s = await send("Page.captureScreenshot", { format: "png", clip: pageClip });
        writeFileSync(join(outDir, `${cropName}-${i}.png`), Buffer.from(s.result.data, "base64"));
      }
      boxes[`${cropName}:clip`] = { x: clip.x, y: clip.y, w: clip.width, h: clip.height, count };
    }
    // Progressive typing: crops of the field after every few characters, for the film's typing animation.
    else if (kind === "typeShots") {
      const [, query, text, every, cropName, pad = 6] = step;
      const box = await evaluate(`(() => { const el = __find(${JSON.stringify(query)}); el.focus(); return __box(el); })()`);
      boxes[`${cropName}`] = box;
      const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + pad * 2, height: box.h + pad * 2, scale: 1 };
      // captureScreenshot clips in page coordinates; the boxes are viewport coordinates.
      const scroll = await evaluate("[scrollX, scrollY]"); const pageClip = { ...clip, x: clip.x + scroll[0], y: clip.y + scroll[1] };
      const counts = []; for (let i = 0; i < text.length; i += every) counts.push(i); counts.push(text.length);
      for (const n of counts) {
        await evaluate(`(() => { const el = __find(${JSON.stringify(query)}); __type(el, ${JSON.stringify(text)}.slice(0, ${n})); return true; })()`);
        await sleep(90);
        await evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))");
        const s = await send("Page.captureScreenshot", { format: "png", clip: pageClip });
        writeFileSync(join(outDir, `${cropName}-${String(n).padStart(2, "0")}.png`), Buffer.from(s.result.data, "base64"));
      }
      boxes[`${cropName}:clip`] = { x: clip.x, y: clip.y, w: clip.width, h: clip.height, counts };
    }
    else if (kind === "box" || kind === "click" || kind === "type") {
      const r = await evaluate(`(() => { const el = __find(${JSON.stringify(arg)}); if (!el) return null; ${kind === "click" ? "" : ""} return __box(el); })()`);
      if (!r) throw Error(`not found: ${arg}`);
      if (kind === "box" || kind === "click") boxes[extra || arg] = r;
      if (kind === "click") { await evaluate(`(() => { const el = __find(${JSON.stringify(arg)}); el.click(); return true; })()`); await sleep(500); }
      if (kind === "type") { await evaluate(`(() => { const el = __find(${JSON.stringify(arg)}); el.focus(); __type(el, ${JSON.stringify(extra)}); return true; })()`); await sleep(250); }
    } else if (kind === "file") {
      const doc = await send("DOM.getDocument", { depth: -1, pierce: true });
      const q = await send("DOM.querySelector", { nodeId: doc.result.root.nodeId, selector: arg });
      if (!q.result?.nodeId) throw Error(`no file input ${arg}`);
      await send("DOM.setFileInputFiles", { nodeId: q.result.nodeId, files: [extra] });
      await sleep(800);
    } else throw Error(`unknown step ${kind}`);
  }
}
// The sample day's clock: every new page sees Date at the given local time (and it keeps ticking from there).
// window.__advance(ms) moves it forward, e.g. to give a routine a realistic length.
let clockScript = null;
async function setClock(iso) {
  if (clockScript) { await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: clockScript }); clockScript = null; }
  // Every group starts from clean storage (Reading comfort, drafts), so one capture never leaks into the next.
  const fresh = "try { localStorage.clear(); sessionStorage.clear(); } catch {}";
  if (!iso) { clockScript = (await send("Page.addScriptToEvaluateOnNewDocument", { source: fresh })).result.identifier; return; }
  const source = `${fresh} (() => { const Real = Date; let offset = new Real(${JSON.stringify(iso)}).getTime() - Real.now();
    class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); } static now() { return Real.now() + offset; } }
    window.Date = Fake; window.__advance = ms => { offset += ms; return true; }; })();`;
  clockScript = (await send("Page.addScriptToEvaluateOnNewDocument", { source })).result.identifier;
}
async function open(query) {
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url: `${base}?${query}` });
  await loaded; await sleep(2500);
  await evaluate(helpers);
  await evaluate("document.fonts.ready.then(() => true)");
}
async function shot(name) {
  await evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))");
  const s = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(s.result.data, "base64"));
}

if (args[0] === "--explore") {
  const [w, h] = (args[3] || "").split("x").map(Number);
  if (w && h) await setViewport({ width: w, height: h, scale: 1, mobile: false });
  await setClock(process.env.CLOCK || null); // clean storage (and the sample day's clock, if CLOCK is set)
  await open(args[1]);
  if (args[2]) await runSteps(JSON.parse(args[2].startsWith("@") ? readFileSync(args[2].slice(1), "utf8") : args[2]), {}); // @file.json for steps with backslashes
  await shot("_explore");
  // The whole page at half scale, for planning: _explore-full.png (FULL=1).
  if (process.env.FULL) {
    const [w, h] = await evaluate("[innerWidth, document.documentElement.scrollHeight]");
    const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: Math.min(h, 6000), scale: 0.5 } });
    writeFileSync(join(outDir, "_explore-full.png"), Buffer.from(s.result.data, "base64"));
  }
  const list = await evaluate(`[...document.querySelectorAll('button, a, [role=button], [role=tab], input, textarea, select, summary, h1, h2')].filter(__vis).map(el => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || el.getAttribute('aria-label') || el.placeholder || '').trim().replace(/\\s+/g, ' ').slice(0, 70), ...__box(el) }))`);
  for (const e of list) console.log(`${e.tag.padEnd(8)} ${String(e.x).padStart(6)} ${String(e.y).padStart(7)} ${String(e.w).padStart(6)}x${String(e.h).padEnd(6)} ${e.text}`);
  console.log("scrollY", await evaluate("scrollY"), "docHeight", await evaluate("document.documentElement.scrollHeight"));
} else {
  const { plan } = await import(`${pathToFileURL(filmFile("capture-plan.mjs")).href}?${Date.now()}`);
  const only = args[0] ? new Set(args[0].split(",")) : null;
  const jsonPath = join(outDir, "shots.json");
  const all = existsSync(jsonPath) ? JSON.parse(readFileSync(jsonPath, "utf8")) : {};
  for (const group of plan) {
    const names = group.shots.map(s => s.name);
    if (only && !names.some(n => only.has(n))) continue;
    await setViewport(group.viewport);
    base = group.base || harness;
    await setClock(group.clock);
    await open(group.query);
    for (const s of group.shots) {
      const boxes = {};
      try { await runSteps(s.steps || [], boxes); } catch (e) { console.log(`${s.name}: ${e.message}`); break; }
      await shot(s.name);
      all[s.name] = { boxes, scrollY: await evaluate("scrollY") };
      console.log("shot", s.name, JSON.stringify(boxes));
    }
  }
  writeFileSync(jsonPath, JSON.stringify(all, null, 1));
}
await send("Browser.close").catch(() => {});
ws.close(); proc.kill();
