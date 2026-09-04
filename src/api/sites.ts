import { apiClient } from "./client";
import type { CreateSiteRequest, SiteDto, UpdateSiteRequest } from "./types";

export function getSites(): Promise<SiteDto[]> {
  return apiClient.get<SiteDto[]>("/sites");
}

export function createSite(request: CreateSiteRequest): Promise<SiteDto> {
  return apiClient.post<SiteDto>("/sites", request);
}

export function updateSite(id: string, request: UpdateSiteRequest): Promise<SiteDto> {
  return apiClient.put<SiteDto>(`/sites/${id}`, request);
}
