// Where things are, wherever this folder lives: in the Daywell repo (marketing/promo) or as a working copy next to a
// Daywell checkout (promo/ beside daywell/). Works on Windows, Mac and Linux.
// Override with environment variables: CHROME (browser executable), FFMPEG (ffmpeg executable).
// Films: the promo is the folder itself; others live in sub-folders (shorts/eat …), chosen with --film=shorts/eat.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { tmpdir, platform } from "node:os";
import { join, resolve, relative } from "node:path";
import { existsSync, readFileSync } from "node:fs";

export const promoRoot = fileURLToPath(new URL("..", import.meta.url));
const asRepo = fileURLToPath(new URL("../../..", import.meta.url)); // marketing/promo/tools → the repo
const asSibling = fileURLToPath(new URL("../../daywell", import.meta.url)); // promo/tools → ../daywell
export const repoRoot = existsSync(join(asRepo, "app", "daywell.tsx")) ? asRepo : asSibling;
const repoRequire = createRequire(join(repoRoot, "package.json"));
export const loadSharp = () => repoRequire("sharp"); // installed with the app's dependencies (npm run install:ci)
export const CHROME = process.env.CHROME
  || { win32: "C:/Program Files/Google/Chrome/Application/chrome.exe", darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" }[platform()]
  || "google-chrome";
export const TMP = join(tmpdir(), "daywell-promo"); // Chrome profiles for rendering and capturing
export const SECRETS = join(repoRoot, ".dev.vars"); // ELEVENLABS_API_KEY=… (git-ignored; never print it)

// The film being worked on: --film=shorts/eat (relative to the promo folder). Without it, the promo itself.
const filmArg = process.argv.find(a => a.startsWith("--film="))?.slice(7);
export const filmRoot = filmArg ? resolve(promoRoot, filmArg) : promoRoot;
export const filmPath = relative(promoRoot, filmRoot).split("\\").join("/"); // "" for the promo, "shorts/eat" …
export const args = process.argv.slice(2).filter(a => !a.startsWith("--film="));
if (!existsSync(join(filmRoot, "film.json"))) throw Error(`No film.json in ${filmPath || "the promo folder"}`);
// A film's own file, or the promo's older place for it under tools/ (the promo keeps its plans there).
export const filmFile = name => [join(filmRoot, name), join(filmRoot, "tools", name)].find(existsSync) || join(filmRoot, name);
// film.json: the output name, length, music take and mix settings (see README).
export const film = { length: 120, music: "take1.mp3", mix: {}, ...JSON.parse(readFileSync(join(filmRoot, "film.json"), "utf8")) };
