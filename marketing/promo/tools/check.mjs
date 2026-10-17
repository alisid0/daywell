// Renders stills at the given seconds and puts them on one contact sheet, for checking a film between renders.
//   node tools/check.mjs [--film=shorts/eat] <sheet.png> <columns> <t1,t2,…>
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { promoRoot, filmRoot, filmPath, args } from "./paths.mjs";

const [out, cols, list] = args;
const times = list.split(",").map(Number);
const film = filmPath ? [`--film=${filmPath}`] : [];
const r = spawnSync(process.execPath, [join(promoRoot, "render.mjs"), ...film, `--stills=${times.join(",")}`], { cwd: promoRoot, encoding: "utf8" });
if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
const errs = (r.stderr || "").trim(); if (errs) console.error(errs.slice(0, 2000));
const files = times.map(t => join(filmRoot, "out", "stills", `t${t.toFixed(2).padStart(6, "0")}.png`));
const s = spawnSync(process.execPath, [join(promoRoot, "tools", "sheet.mjs"), out, cols, String(Math.floor(1240 / Number(cols)) - 8), ...files], { cwd: promoRoot, encoding: "utf8" });
console.log(s.stdout.trim(), s.stderr.trim());
