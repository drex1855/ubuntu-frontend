import { apiClient } from "./client";
import type {
  CreateModelAccountRequest,
  ModelAccountDto,
  ResetPasswordRequest,
  UpdateAccountStatusRequest,
  UpdateModelAccountRequest,
} from "./types";

export function getModelAccounts(): Promise<ModelAccountDto[]> {
  return apiClient.get<ModelAccountDto[]>("/modelaccounts");
}

export function createModelAccount(
  request: CreateModelAccountRequest,
): Promise<ModelAccountDto> {
  return apiClient.post<ModelAccountDto>("/modelaccounts", request);
}

export function updateModelAccount(
  id: string,
  request: UpdateModelAccountRequest,
): Promise<ModelAccountDto> {
  return apiClient.put<ModelAccountDto>(`/modelaccounts/${id}`, request);
}

export function setModelAccountStatus(
  id: string,
  request: UpdateAccountStatusRequest,
): Promise<ModelAccountDto> {
  return apiClient.patch<ModelAccountDto>(`/modelaccounts/${id}/status`, request);
}

export function resetModelAccountPassword(id: string, request: ResetPasswordRequest): Promise<void> {
  return apiClient.post<void>(`/modelaccounts/${id}/reset-password`, request);
}
