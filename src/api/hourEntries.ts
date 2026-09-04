import { apiClient } from "./client";
import type { CreateHourEntryRequest, HourEntryDto, HourEntrySearchParams } from "./types";

export function createHourEntry(request: CreateHourEntryRequest): Promise<HourEntryDto> {
  return apiClient.post<HourEntryDto>("/hourentries", request);
}

export function searchHourEntries(params: HourEntrySearchParams): Promise<HourEntryDto[]> {
  return apiClient.get<HourEntryDto[]>("/hourentries", params);
}

export function getMyHourEntries(): Promise<HourEntryDto[]> {
  return apiClient.get<HourEntryDto[]>("/hourentries/me");
}
