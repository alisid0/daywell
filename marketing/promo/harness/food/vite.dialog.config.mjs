// A second copy of the food harness on port 5195, so one session can preview while another uses 5196.
// Its own dependency cache keeps the two servers from optimising into the same folder.
import { fileURLToPath } from "node:url";
import base from "./vite.config.mjs";
const here = fileURLToPath(new URL(".", import.meta.url));
export default { ...base, cacheDir: here + ".vite-dialog", server: { ...base.server, port: 5195, strictPort: true } };
