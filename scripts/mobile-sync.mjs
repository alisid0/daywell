// Prepares Daywell's Android and iPhone apps. Writes the bundled pages for the chosen hosted service (a loading page and
// the screen shown when Daywell cannot be reached), then copies them and capacitor.config.ts into the native projects.
// Usage: node scripts/mobile-sync.mjs [android|ios] [--pages-only]
// DAYWELL_APP_URL selects the hosted service; without it, test builds open the owner-only private tester app.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const app = JSON.parse(readFileSync('mobile/app.json', 'utf8'));
const url = new URL(process.env.DAYWELL_APP_URL || app.testerUrl);
if (url.protocol !== 'https:') throw new Error('The phone apps only open Daywell over HTTPS.');
const target = JSON.stringify(`${url.origin}/`);

const page = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; min-height: 100vh; box-sizing: border-box; padding: 24px; display: grid; place-items: center; text-align: center;
    background: #fae7ef; color: #522d46; font: 18px/1.5 "Atkinson Hyperlegible Next", system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 340px; display: grid; gap: 14px; }
  h1 { margin: 0; font-size: 26px; line-height: 1.2; }
  p { margin: 0; color: #7d536e; }
  button { justify-self: center; margin-top: 8px; border: 0; border-radius: 999px; padding: 14px 28px; min-height: 48px;
    background: #803c65; color: #fff7fb; font: inherit; font-weight: 700; }
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;

mkdirSync('mobile/www', { recursive: true });
writeFileSync('mobile/www/index.html', page('Daywell', `  <h1>Daywell</h1>
  <p>Opening…</p>
  <script>location.replace(${target});</script>`));
writeFileSync('mobile/www/offline.html', page('Daywell can’t connect', `  <h1>Daywell can’t connect</h1>
  <p>Check your internet connection, then try again.</p>
  <button type="button" onclick="location.replace(${target.replace(/"/g, '&quot;')})">Try again</button>`));
console.log(`Bundled pages open ${url.origin}`);

const args = process.argv.slice(2);
if (args.includes('--pages-only')) process.exit(0);
const platform = args.find(arg => arg === 'android' || arg === 'ios');
const result = spawnSync(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', ...(platform ? [platform] : [])], { stdio: 'inherit' });
process.exit(result.status ?? 1);
