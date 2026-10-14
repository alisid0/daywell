// Renders stills at the given seconds and puts them on one contact sheet, for checking the film between renders.
//   node tools/check.mjs <sheet.png> <columns> <t1,t2,…>
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const [out, cols, list] = process.argv.slice(2);
const times = list.split(",").map(Number);
const r = spawnSync(process.execPath, [join(root, "render.mjs"), `--stills=${times.join(",")}`], { cwd: root, encoding: "utf8" });
if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
const errs = (r.stderr || "").trim(); if (errs) console.error(errs.slice(0, 2000));
const files = times.map(t => join(root, "out", "stills", `t${t.toFixed(2).padStart(6, "0")}.png`));
const s = spawnSync(process.execPath, [join(root, "tools", "sheet.mjs"), out, cols, String(Math.floor(1240 / Number(cols)) - 8), ...files], { cwd: root, encoding: "utf8" });
console.log(s.stdout.trim(), s.stderr.trim());
