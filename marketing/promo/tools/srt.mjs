// Writes captions (.srt) from the voiceover's word timings: one card per sentence (split again if long), at most
// two lines of about 32 characters, each shown from its first word to just after its last.
//   node tools/srt.mjs [--film=shorts/eat] [out.srt, default <film>/out/<name>.srt]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { filmRoot, film, args } from "./paths.mjs";

const src = readFileSync(join(filmRoot, "data", "film-data.js"), "utf8");
const D = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
const cards = [];
for (const line of D.vo) {
  let cur = [];
  const flush = () => { if (cur.length) cards.push(cur); cur = []; };
  for (const w of line.words) { cur.push(w); if (/[.?!:]$/.test(w.w) || (cur.map(x => x.w).join(" ").length > 52 && /,$/.test(w.w))) flush(); }
  flush();
}
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
const wrap = text => { if (text.length <= 34) return text; const words = text.split(" "); let best = text, score = 1e9; for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(" "), b = words.slice(i).join(" "); const s = Math.max(a.length, b.length); if (s < score) { score = s; best = `${a}\n${b}`; } } return best; };
// Spoken forms shown as written: prices as figures, the address as an address.
const shown = text => text.replace(/four ninety-nine/gi, "£4.99").replace(/nine ninety-nine/gi, "£9.99").replace(/daywell dot date/gi, "daywell.date");
let out = "", n = 0;
cards.forEach((c, i) => {
  const text = shown(c.map(w => w.w).join(" "));
  const start = c[0].t, next = cards[i + 1]?.[0].t ?? start + 10, end = Math.min(next - 0.05, c.at(-1).e + 0.6);
  out += `${++n}\n${ts(start)} --> ${ts(Math.max(end, start + 0.8))}\n${wrap(text)}\n\n`;
});
const file = args[0] || join(filmRoot, "out", `${film.name}.srt`);
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, out);
console.log("captions", n, "→", file);
