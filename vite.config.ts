import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },

    // 1️ Proxy only in development
    ...(mode === "development"
      ? {
          proxy: {
            "/api": {
              target: "http://localhost:3001",
              changeOrigin: true,
            },
          },
        }
      : {}),
  },

  // 2️Plugins
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

  // 3️⃣ Path alias
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));