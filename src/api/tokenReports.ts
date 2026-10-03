import { apiClient } from "./client";
import type {
  CreateTokenReportRequest,
  TokenReportDto,
  TokenReportSearchParams,
  TokenSummaryDto,
} from "./types";

export function createTokenReport(request: CreateTokenReportRequest): Promise<TokenReportDto> {
  return apiClient.post<TokenReportDto>("/tokenreports", request);
}

export function searchTokenReports(params: TokenReportSearchParams): Promise<TokenReportDto[]> {
  return apiClient.get<TokenReportDto[]>("/tokenreports", params);
}

export function getTokenReportsSummary(
  params: TokenReportSearchParams,
): Promise<TokenSummaryDto[]> {
  return apiClient.get<TokenSummaryDto[]>("/tokenreports/summary", params);
}

export function getMyTokenReports(): Promise<TokenReportDto[]> {
  return apiClient.get<TokenReportDto[]>("/tokenreports/me");
}

export function getMyTokenSummary(): Promise<TokenSummaryDto[]> {
  return apiClient.get<TokenSummaryDto[]>("/tokenreports/me/summary");
}
