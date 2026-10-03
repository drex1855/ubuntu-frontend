import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    sourcemap: false,
  },
  esbuild: {
    drop: mode === "production" ? (["console", "debugger"] as const) : [],
  },
}));
