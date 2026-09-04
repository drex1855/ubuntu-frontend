import { apiClient } from "./client";
import type { CreateFineRequest, FineDto, FineSearchParams, UpdateFineStatusRequest } from "./types";

export function createFine(request: CreateFineRequest): Promise<FineDto> {
  return apiClient.post<FineDto>("/fines", request);
}

export function searchFines(params: FineSearchParams): Promise<FineDto[]> {
  return apiClient.get<FineDto[]>("/fines", params);
}

export function setFineStatus(id: string, request: UpdateFineStatusRequest): Promise<FineDto> {
  return apiClient.patch<FineDto>(`/fines/${id}/status`, request);
}

export function getMyFines(): Promise<FineDto[]> {
  return apiClient.get<FineDto[]>("/fines/me");
}
