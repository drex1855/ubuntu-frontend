import { apiClient } from "./client";
import type { LoginRequest, LoginResponse } from "./types";

export function login(request: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/auth/login", request, { skipAuth: true });
}
