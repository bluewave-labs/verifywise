// vite.config.ts
import { defineConfig } from "file:///A:/VerifyWiseRepository/verifywise/Clients/node_modules/vite/dist/node/index.js";
import react from "file:///A:/VerifyWiseRepository/verifywise/Clients/node_modules/@vitejs/plugin-react-swc/index.mjs";
import svgr from "file:///A:/VerifyWiseRepository/verifywise/Clients/node_modules/@svgr/rollup/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    svgr()
  ],
  server: {
    host: "0.0.0.0",
    port: process.env.VITE_APP_PORT ? parseInt(process.env.VITE_APP_PORT) : 5173
  },
  build: {
    // Generate manifest for cache busting
    manifest: true,
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  },
  define: { global: "globalThis" }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJBOlxcXFxWZXJpZnlXaXNlUmVwb3NpdG9yeVxcXFx2ZXJpZnl3aXNlXFxcXENsaWVudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkE6XFxcXFZlcmlmeVdpc2VSZXBvc2l0b3J5XFxcXHZlcmlmeXdpc2VcXFxcQ2xpZW50c1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQTovVmVyaWZ5V2lzZVJlcG9zaXRvcnkvdmVyaWZ5d2lzZS9DbGllbnRzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHN2Z3IgZnJvbSBcIkBzdmdyL3JvbGx1cFwiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgc3ZncigpLFxyXG4gIF0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcclxuICAgIHBvcnQ6IHByb2Nlc3MuZW52LlZJVEVfQVBQX1BPUlRcclxuICAgICAgPyBwYXJzZUludChwcm9jZXNzLmVudi5WSVRFX0FQUF9QT1JUKVxyXG4gICAgICA6IDUxNzMsXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gR2VuZXJhdGUgbWFuaWZlc3QgZm9yIGNhY2hlIGJ1c3RpbmdcclxuICAgIG1hbmlmZXN0OiB0cnVlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvLyBBZGQgaGFzaCB0byBmaWxlbmFtZXMgZm9yIGNhY2hlIGJ1c3RpbmdcclxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJ1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBkZWZpbmU6IHsgZ2xvYmFsOiBcImdsb2JhbFRoaXNcIiB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3VCxTQUFTLG9CQUFvQjtBQUNyVixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBR2pCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxFQUNQO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNLFFBQVEsSUFBSSxnQkFDZCxTQUFTLFFBQVEsSUFBSSxhQUFhLElBQ2xDO0FBQUEsRUFDTjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFTCxVQUFVO0FBQUEsSUFDVixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxRQUVOLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVEsRUFBRSxRQUFRLGFBQWE7QUFDakMsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
