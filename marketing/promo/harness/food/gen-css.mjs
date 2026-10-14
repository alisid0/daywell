// Writes css.js with the app's stylesheet imports in the same order as app/layout.tsx on the checked-out branch.
import { readFileSync, writeFileSync } from "node:fs";
const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
const lines = [...layout.matchAll(/^import "(@fontsource[^"]+|\.\/[a-z-]+\.css)";/gm)].map(m => `import "${m[1].replace(/^\.\//, "@/app/")}";`);
writeFileSync(new URL("./css.js", import.meta.url), lines.join("\n") + "\n");
console.log(`${lines.length} imports`);
