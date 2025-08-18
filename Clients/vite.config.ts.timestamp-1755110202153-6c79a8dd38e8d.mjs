// vite.config.ts
import { defineConfig } from "file:///mnt/d/verifywise/Clients/node_modules/vite/dist/node/index.js";
import react from "file:///mnt/d/verifywise/Clients/node_modules/@vitejs/plugin-react-swc/index.mjs";
import svgr from "file:///mnt/d/verifywise/Clients/node_modules/@svgr/rollup/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    svgr()
    // Removed the problematic HTML loader plugin that was causing parsing errors
    // {
    //   name: "html-loader",
    //   enforce: "pre",
    //   transform(code, id) {
    //     if (id.endsWith(".html")) {
    //       const cleaned = code
    //         .replace(/<!--[\s\S]*?-->/g, "")
    //         .replace(/\s+/g, " ")
    //         .trim();
    //       return {
    //         code: `export default ${JSON.stringify(cleaned)};`,
    //         map: null,
    //       };
    //     }
    //   },
    // },
  ],
  server: {
    host: "0.0.0.0",
    port: process.env.VITE_APP_PORT ? parseInt(process.env.VITE_APP_PORT) : 5173
  },
  define: { global: "globalThis" }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2QvdmVyaWZ5d2lzZS9DbGllbnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvbW50L2QvdmVyaWZ5d2lzZS9DbGllbnRzL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9tbnQvZC92ZXJpZnl3aXNlL0NsaWVudHMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgc3ZnciBmcm9tIFwiQHN2Z3Ivcm9sbHVwXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBzdmdyKCksXHJcbiAgICAvLyBSZW1vdmVkIHRoZSBwcm9ibGVtYXRpYyBIVE1MIGxvYWRlciBwbHVnaW4gdGhhdCB3YXMgY2F1c2luZyBwYXJzaW5nIGVycm9yc1xyXG4gICAgLy8ge1xyXG4gICAgLy8gICBuYW1lOiBcImh0bWwtbG9hZGVyXCIsXHJcbiAgICAvLyAgIGVuZm9yY2U6IFwicHJlXCIsXHJcbiAgICAvLyAgIHRyYW5zZm9ybShjb2RlLCBpZCkge1xyXG4gICAgLy8gICAgIGlmIChpZC5lbmRzV2l0aChcIi5odG1sXCIpKSB7XHJcbiAgICAvLyAgICAgICBjb25zdCBjbGVhbmVkID0gY29kZVxyXG4gICAgLy8gICAgICAgICAucmVwbGFjZSgvPCEtLVtcXHNcXFNdKj8tLT4vZywgXCJcIilcclxuICAgIC8vICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXHJcbiAgICAvLyAgICAgICAgIC50cmltKCk7XHJcblxyXG4gICAgLy8gICAgICAgcmV0dXJuIHtcclxuICAgIC8vICAgICAgICAgY29kZTogYGV4cG9ydCBkZWZhdWx0ICR7SlNPTi5zdHJpbmdpZnkoY2xlYW5lZCl9O2AsXHJcbiAgICAvLyAgICAgICAgIG1hcDogbnVsbCxcclxuICAgIC8vICAgICAgIH07XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICB9LFxyXG4gICAgLy8gfSxcclxuICBdLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXHJcbiAgICBwb3J0OiBwcm9jZXNzLmVudi5WSVRFX0FQUF9QT1JUXHJcbiAgICAgID8gcGFyc2VJbnQocHJvY2Vzcy5lbnYuVklURV9BUFBfUE9SVClcclxuICAgICAgOiA1MTczLFxyXG4gIH0sXHJcbiAgZGVmaW5lOiB7IGdsb2JhbDogXCJnbG9iYWxUaGlzXCIgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlAsU0FBUyxvQkFBb0I7QUFDMVIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUdqQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBbUJQO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNLFFBQVEsSUFBSSxnQkFDZCxTQUFTLFFBQVEsSUFBSSxhQUFhLElBQ2xDO0FBQUEsRUFDTjtBQUFBLEVBQ0EsUUFBUSxFQUFFLFFBQVEsYUFBYTtBQUNqQyxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
