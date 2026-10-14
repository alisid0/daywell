// Writes captions (.srt) from the voiceover's word timings: one card per sentence (split again if long), at most
// two lines of about 32 characters, each shown from its first word to just after its last.
//   node tools/srt.mjs out/daywell-promo-v2.srt
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = readFileSync(join(root, "data", "film-data.js"), "utf8");
const D = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
const SHOW = { "four": "£4.99", "nine": "£9.99" }; // spoken prices shown as figures
const cards = [];
for (const line of D.vo) {
  let cur = [];
  const flush = () => { if (cur.length) cards.push(cur); cur = []; };
  for (const w of line.words) { cur.push(w); if (/[.?!:]$/.test(w.w) || (cur.map(x => x.w).join(" ").length > 52 && /,$/.test(w.w))) flush(); }
  flush();
}
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
const wrap = text => { if (text.length <= 34) return text; const words = text.split(" "); let best = text, score = 1e9; for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(" "), b = words.slice(i).join(" "); const s = Math.max(a.length, b.length); if (s < score) { score = s; best = `${a}\n${b}`; } } return best; };
let out = "", n = 0;
cards.forEach((c, i) => {
  let text = c.map(w => w.w).join(" ").replace(/four ninety-nine/g, "£4.99").replace(/nine ninety-nine/g, "£9.99").replace(/Daywell dot date/, "daywell.date");
  const start = c[0].t, next = cards[i + 1]?.[0].t ?? start + 10, end = Math.min(next - 0.05, c.at(-1).e + 0.6);
  out += `${++n}\n${ts(start)} --> ${ts(Math.max(end, start + 0.8))}\n${wrap(text)}\n\n`;
});
void SHOW;
writeFileSync(process.argv[2], out);
console.log("captions", n, "→", process.argv[2]);
