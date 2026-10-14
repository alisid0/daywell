// Where things are, wherever the Daywell repo is checked out (Windows, Mac or Linux).
// Override with environment variables: CHROME (browser executable), FFMPEG (ffmpeg executable).
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";

export const promoRoot = fileURLToPath(new URL("..", import.meta.url)); // marketing/promo/
export const repoRoot = fileURLToPath(new URL("../../..", import.meta.url)); // the Daywell repo
const repoRequire = createRequire(join(repoRoot, "package.json"));
export const loadSharp = () => repoRequire("sharp"); // installed with the app's dependencies (npm run install:ci)
export const CHROME = process.env.CHROME
  || { win32: "C:/Program Files/Google/Chrome/Application/chrome.exe", darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" }[platform()]
  || "google-chrome";
export const TMP = join(tmpdir(), "daywell-promo"); // Chrome profiles for rendering and capturing
export const SECRETS = join(repoRoot, ".dev.vars"); // ELEVENLABS_API_KEY=… (git-ignored; never print it)
