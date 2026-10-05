// Fails when a change adds lint errors to the files it touches. Older lint debt elsewhere doesn't block it.
// Usage: npm run lint:changed            (compares with origin/main)
//        npm run lint:changed -- main    (compares with another branch)
import { execFileSync } from "node:child_process";
import { ESLint } from "eslint";

const base = process.argv[2] || "origin/main";
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const since = git("merge-base", base, "HEAD").trim();
const files = git("diff", "--name-only", "--diff-filter=ACMR", since, "--", "*.ts", "*.tsx", "*.mjs")
  .split("\n").map(file => file.trim()).filter(file => file && !file.startsWith("work/"));

const eslint = new ESLint();
let worse = 0;
for (const file of files) {
  if (await eslint.isPathIgnored(file)) continue;
  const [now] = await eslint.lintFiles([file]);
  let before = 0;
  try {
    const [old] = await eslint.lintText(git("show", `${since}:${file}`), { filePath: file });
    before = old.errorCount;
  } catch { /* A new file starts from zero. */ }
  if (now.errorCount > before) {
    worse++;
    console.log(`\n${file}: ${now.errorCount} lint errors, was ${before}`);
    for (const message of now.messages.filter(item => item.severity === 2)) console.log(`  ${message.line}:${message.column}  ${message.message}  (${message.ruleId})`);
  }
}
console.log(worse ? `\n${worse} changed file(s) gained lint errors.` : `Checked ${files.length} changed file(s): no new lint errors.`);
process.exit(worse ? 1 : 0);
