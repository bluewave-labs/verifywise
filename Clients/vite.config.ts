import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "@svgr/rollup";
import lingoCompiler from "lingo.dev/compiler";

// https://vitejs.dev/config/
const viteConfig = {
  plugins: [react(), svgr()],
  server: {
    host: "0.0.0.0",
    port: process.env.VITE_APP_PORT
      ? parseInt(process.env.VITE_APP_PORT)
      : 5173,
  },
  define: { global: "globalThis" },
}
export default defineConfig(() =>
  lingoCompiler.vite({
    sourceRoot: "src",
    targetLocales: ["es", "fr", "de"],
    models: "lingo.dev"
  })(viteConfig),
);
