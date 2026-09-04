// Almacenamiento de sesión de bajo nivel, sin dependencias de React, para que tanto el
// AuthContext como el cliente HTTP (api/client.ts) puedan leer/limpiar el token sin
// importarse entre sí (evita ciclos de import).
//
// Se usa sessionStorage (no localStorage) a propósito: la sesión desaparece al cerrar la
// pestaña/navegador, acotando la ventana de exposición del JWT frente a persistencia
// indefinida. El token nunca se coloca en la URL ni en query strings.

import type { AccountRole } from "../api/types";

const STORAGE_KEY = "webcam-studio.session";

export interface Session {
  token: string;
  expiresAt: string;
  accountId: string;
  fullName: string;
  role: AccountRole;
}

export function readSession(): Session | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed.token || !parsed.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function writeSession(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Evento disparado por el cliente HTTP cuando el backend responde 401, para que el
 * AuthContext pueda reaccionar (limpiar sesión + redirigir) sin acoplarse a fetch. */
export const UNAUTHORIZED_EVENT = "webcam-studio:unauthorized";

export function notifyUnauthorized(): void {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}
