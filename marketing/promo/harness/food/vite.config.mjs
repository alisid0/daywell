import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const app = fileURLToPath(new URL("../../", import.meta.url)).replace(/[\/]$/, "");
const here = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root: here,
  publicDir: app + "/public",
  plugins: [react()],
  define: { "process.env": {} },
  css: { postcss: app },
  resolve: { alias: [{ find: "@/app/chatgpt-auth", replacement: here + "auth-shim.js" }, { find: "next/link", replacement: here + "link-shim.jsx" }, { find: "@", replacement: app }] },
  server: { host: "127.0.0.1", port: 5196, fs: { allow: [app] } },
});
