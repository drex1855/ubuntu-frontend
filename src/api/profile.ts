import { apiClient } from "./client";
import type { ChangePasswordRequest, ModelAccountDto, UpdateModelAccountRequest } from "./types";

export function getMyProfile(): Promise<ModelAccountDto> {
  return apiClient.get<ModelAccountDto>("/profile/me");
}

export function updateMyProfile(request: UpdateModelAccountRequest): Promise<ModelAccountDto> {
  return apiClient.put<ModelAccountDto>("/profile/me", request);
}

export function changeMyPassword(request: ChangePasswordRequest): Promise<void> {
  return apiClient.post<void>("/profile/change-password", request);
}
