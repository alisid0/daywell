// FFmpeg: the FFMPEG environment variable, else ffmpeg-static from a short path (Windows on the owner's machine can't
// start programs from very long paths: `npm i --prefix %TEMP%\claude\ffm ffmpeg-static`), else ffmpeg-static
// installed anywhere Node can find it, else `ffmpeg` on the PATH.
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const short = join(tmpdir(), "claude", "ffm", "node_modules", "ffmpeg-static", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
let found = process.env.FFMPEG || (existsSync(short) ? short : null);
if (!found) { try { found = createRequire(import.meta.url)("ffmpeg-static"); } catch { /* not installed */ } }
export const FFMPEG = found || "ffmpeg";
