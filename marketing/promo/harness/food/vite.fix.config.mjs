// The food harness for the daywell-fix worktree, on port 5194, so it can run beside the main clone's harnesses.
import { fileURLToPath } from "node:url";
import base from "./vite.config.mjs";
const here = fileURLToPath(new URL(".", import.meta.url));
export default { ...base, cacheDir: here + ".vite-fix", server: { ...base.server, port: 5194, strictPort: true } };
