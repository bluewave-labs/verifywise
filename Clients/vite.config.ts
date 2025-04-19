import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "@svgr/rollup";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    host: "0.0.0.0",
    port: process.env.VITE_APP_PORT
      ? parseInt(process.env.VITE_APP_PORT)
      : 5173,
  },
  define: { global: "globalThis" },
});
