import { defineConfig } from "vite";

export default defineConfig({
  root: "web",
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/health": "http://localhost:4000",
    },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
});
