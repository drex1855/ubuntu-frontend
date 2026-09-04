import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Permite servir bajo cualquier dominio (ej. un tunel temporal de Cloudflare para
    // compartir el sitio). Vite bloquea el Host por defecto para evitar DNS rebinding;
    // esto solo aplica a 'npm run dev' (nunca al build de produccion), y este server
    // de desarrollo solo corre en tu maquina, asi que no agrega riesgo real.
    allowedHosts: true,
  },
  build: {
    // Sin mapas de fuente en el build de produccion: evita que alguien reconstruya el
    // codigo original (nombres de variables, comentarios) a partir de dist/.
    sourcemap: false,
  },
  esbuild: {
    // Por si algun console.log/debugger se cuela sin querer, el build de produccion lo
    // quita solo -- en desarrollo (npm run dev) se mantiene para poder depurar.
    drop: mode === "production" ? (["console", "debugger"] as const) : [],
  },
}));
