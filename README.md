# Webcam Studio — Frontend

Panel de control en React + TypeScript para el backend de Webcam Studio
(`webcam-studio-backend/`, .NET 8 + MySQL). Cubre los 5 módulos de negocio del backend
—Cuentas de modelos, Inventario, Reporte de tokens, Checklist de habitaciones y
WhatsApp— más Auditoría, con login por JWT y control de acceso por rol
(`Admin` / `Modelo`).

No usa ningún framework de UI ni Tailwind: los estilos son CSS Modules escritos a mano
sobre variables CSS (`src/styles/tokens.css`), con una identidad visual de "sala de
control" oscura, acento magenta/cian.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior (no estaba instalado en la máquina donde
  se generó este proyecto, así que **nadie ha corrido `npm install` todavía** — es el
  primer paso antes de usarlo).
- El backend corriendo (`docker compose up --build` dentro de `webcam-studio-backend/`,
  o `dotnet run` — ver el README de esa carpeta).

## Arranque

```bash
npm install
cp .env.example .env   # ajustar VITE_API_BASE_URL si el backend no está en localhost:8080
npm run dev
```

La app queda en `http://localhost:5173` (puerto fijo, coincide con `Cors:AllowedOrigins`
ya configurado en el backend). Inicia sesión con una cuenta existente del backend — al
primer arranque del backend se crea un Admin inicial con las credenciales de la sección
`Seed` de `appsettings.json` (cambiarlas es responsabilidad de quien despliegue, ver
README del backend).

Otros comandos:

```bash
npm run build     # type-check (tsc -b) + build de producción a dist/
npm run preview   # sirve el build de dist/ localmente
npm run lint       # solo type-check, sin build
```

## Estructura

```
src/
  api/            # cliente HTTP + tipos + funciones por módulo del backend
  auth/           # sesión (sessionStorage) y guard de rutas
  components/
    layout/       # AppShell, Sidebar, Topbar
    ui/           # Button, Card, Badge, Table, Modal, FormField, Spinner, EmptyState
    feedback/     # sistema de notificaciones (toasts)
  hooks/          # useApi (loading/error/data para GETs)
  pages/          # una página por módulo de negocio + Login/Dashboard/404
  styles/         # tokens.css (tema) y global.css (reset)
  utils/          # formateo de fechas/moneda y etiquetas de enums en español
```

Cada archivo en `src/api/` (`modelAccounts.ts`, `inventory.ts`, `tokenReports.ts`,
`checklists.ts`, `whatsapp.ts`, `sites.ts`, `audit.ts`) es un espejo 1:1 de un
controlador del backend — mismos endpoints, mismos DTOs (ver `src/api/types.ts`).

## Seguridad

- El JWT se guarda en `sessionStorage` (no `localStorage`): desaparece al cerrar la
  pestaña, nunca viaja en la URL, siempre se manda como header `Authorization: Bearer`.
- Sin `dangerouslySetInnerHTML` en ningún componente — todo el render pasa por JSX
  (auto-escapado), así que no hay superficie de XSS por contenido dinámico.
- El cliente HTTP (`src/api/client.ts`) limpia la sesión y redirige a `/login`
  automáticamente ante un 401, y no expone detalles internos ante un 403.
- Las rutas de "Cuentas de modelos" y "Auditoría" están protegidas en el frontend con
  `RequireAuth requiredRole="Admin"` (y ocultas del menú para el rol `Modelo`), pero esto
  es solo UX — la autorización real ya la exige el backend
  (`[Authorize(Roles = "Admin")]`), así que nunca depende únicamente del frontend.
- No hay dependencias de terceros para UI, fechas ni HTTP — solo React, React Router y el
  toolchain de Vite/TypeScript, para minimizar superficie de supply-chain.
- `VITE_API_BASE_URL` es la única configuración del bundle (pública por naturaleza); no
  hay secretos en el código. `.env` está en `.gitignore`.
- En producción, sirve esta app por HTTPS y apunta a un backend HTTPS — y agrega el
  dominio real de este frontend a `Cors:AllowedOrigins` en el backend.
- Agrega una cabecera/meta `Content-Security-Policy` donde sirvas el `dist/` en
  producción (Nginx/Vercel/static host) — es la mitigación real contra XSS dado que el
  JWT vive en `sessionStorage`; este repo no incluye un servidor de archivos propio, así
  que ese CSP se configura en el hosting, no en el código.
- **Escaneo de dependencias (`npm audit`, hecho el 2026-08-26)**: sin hallazgos en
  `react`, `react-dom`, `vite`, `typescript`, `esbuild`. `react-router-dom` sí tiene 2
  CVEs moderados (redirect abierto y deserialización insegura en SSR) que solo están
  parchados en la rama v7 — la app sigue en v6 (API de rutas distinta), así que subir de
  versión es una migración con cambios de código, no un simple bump. Se dejó pendiente a
  propósito en vez de forzar `npm audit fix --force` sin probar cada ruta de la app;
  evaluar la migración a v7 como tarea aparte. Se aplicó igual el bump menor disponible
  dentro de v6 (`react-router-dom@6.30.6`).
