import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from "vite";

/**
 * Plugin to add Cross-Origin headers required for FHE WASM support
 * These headers enable SharedArrayBuffer which is needed for WASM threading
 */
function crossOriginHeaders(): Plugin {
  return {
    name: "configure-server-headers",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  plugins: [react(), crossOriginHeaders()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk"],
  },
  define: {
    // Define process.env for browser compatibility with some libraries
    "process.env": {},
    global: "globalThis",
  },
}));
