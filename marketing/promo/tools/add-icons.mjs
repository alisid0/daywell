// Adds Lucide icons (ISC licence, the same set the app uses) to engine/icons.js from the Daywell checkout's
// node_modules, so the films can use them.
//   node tools/add-icons.mjs glass-water list-checks …
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promoRoot } from "./paths.mjs";
// The working Daywell checkout (daywell-fix) has the current lucide-react, which exports each icon's data.
const repoRoot = join(promoRoot, "..", "daywell-fix");

const file = new URL("../engine/icons.js", import.meta.url);
let src = readFileSync(file, "utf8");
const attrs = o => Object.entries(o).filter(([k]) => k !== "key").map(([k, v]) => `${k}=\\"${v}\\"`).join(" ");
for (const name of process.argv.slice(2)) {
  if (src.includes(`"${name}":`)) { console.log(`has ${name}`); continue; }
  // Some names are aliases ("waves" re-exports waves-horizontal), so follow the re-export to the real icon file.
  const dir = join(repoRoot, "node_modules", "lucide-react", "dist", "esm", "icons");
  let target = `${name}.mjs`;
  const alias = readFileSync(join(dir, target), "utf8").match(/export \{ default \} from '\.\/([^']+)'/);
  if (alias) target = alias[1];
  const mod = await import(pathToFileURL(join(dir, target)).href);
  const svg = mod.__iconData.node.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join("");
  src = src.replace(/window\.ICONS = \{\n/, m => `${m} "${name}": "${svg}",\n`);
  console.log(`added ${name}`);
}
writeFileSync(file, src);
