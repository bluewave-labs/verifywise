import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "@svgr/rollup";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    host: "0.0.0.0",
  },
  define: { global: "globalThis" }
});
