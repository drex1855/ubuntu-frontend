import { apiClient } from "./client";
import type {
  CreateLoanRequestRequest,
  LoanRequestDto,
  LoanRequestSearchParams,
  UpdateLoanRequestStatusRequest,
} from "./types";

export function createLoanRequest(request: CreateLoanRequestRequest): Promise<LoanRequestDto> {
  return apiClient.post<LoanRequestDto>("/loanrequests", request);
}

export function searchLoanRequests(params: LoanRequestSearchParams): Promise<LoanRequestDto[]> {
  return apiClient.get<LoanRequestDto[]>("/loanrequests", params);
}

export function setLoanRequestStatus(
  id: string,
  request: UpdateLoanRequestStatusRequest,
): Promise<LoanRequestDto> {
  return apiClient.patch<LoanRequestDto>(`/loanrequests/${id}/status`, request);
}
