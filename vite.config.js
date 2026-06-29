import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // Served under /drum_jojo/ on GitHub Pages; root for local dev.
  // Sample loading reads import.meta.env.BASE_URL, so this is all that's needed.
  base: command === "build" ? "/drum_jojo/" : "/",
  plugins: [react()],
  server: { port: 5173, open: true },
  build: { target: "es2020", chunkSizeWarningLimit: 1500 },
}));
