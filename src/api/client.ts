import { clearSession, notifyUnauthorized, readSession } from "../auth/session";
import type { ApiResponse, QueryValue } from "./types";

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api").replace(
  /\/+$/,
  "",
);

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, skipAuth } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!skipAuth) {
    const session = readSession();
    if (session) headers.Authorization = `Bearer ${session.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.",
      0,
    );
  }

  if (response.status === 401) {
    clearSession();
    notifyUnauthorized();
    throw new ApiError("Tu sesión expiró. Vuelve a iniciar sesión.", 401);
  }

  if (response.status === 403) {
    throw new ApiError("No tienes permisos para realizar esta acción.", 403);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {

  }

  if (!response.ok || !payload?.success) {
    const message = payload?.message ?? "Ocurrió un error al procesar la solicitud.";
    throw new ApiError(message, response.status, payload?.errors ?? []);
  }

  return payload.data as T;
}

export const apiClient = {
  get: <T>(path: string, query?: Record<string, QueryValue>) =>
    request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown, options?: { skipAuth?: boolean }) =>
    request<T>(path, { method: "POST", body, skipAuth: options?.skipAuth }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const session = readSession();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (session) headers.Authorization = `Bearer ${session.token}`;

  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { method: "POST", headers, body: formData });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.", 0);
  }

  if (response.status === 401) {
    clearSession();
    notifyUnauthorized();
    throw new ApiError("Tu sesión expiró. Vuelve a iniciar sesión.", 401);
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message ?? "No se pudo subir el archivo.", response.status, payload?.errors ?? []);
  }
  return payload.data as T;
}

export async function fetchAuthenticatedBlobUrl(path: string): Promise<string> {
  const session = readSession();
  const headers: Record<string, string> = {};
  if (session) headers.Authorization = `Bearer ${session.token}`;

  const response = await fetch(`${BASE_URL}${path}`, { headers });
  if (!response.ok) throw new ApiError("No se pudo cargar el archivo.", response.status);

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
