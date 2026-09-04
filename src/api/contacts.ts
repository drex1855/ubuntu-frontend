import { apiClient } from "./client";
import type {
  ContactDto,
  ContactSearchParams,
  CreateContactRequest,
  CreatePublicContactRequest,
  CreateTagRequest,
  MassEmailResultDto,
  SendMassEmailRequest,
  TagDto,
  UpdateContactRequest,
} from "./types";

export function submitPublicContact(request: CreatePublicContactRequest): Promise<ContactDto> {
  return apiClient.post<ContactDto>("/contacts/public", request, { skipAuth: true });
}

export function searchContacts(params: ContactSearchParams): Promise<ContactDto[]> {
  return apiClient.get<ContactDto[]>("/contacts", params);
}

export function createContact(request: CreateContactRequest): Promise<ContactDto> {
  return apiClient.post<ContactDto>("/contacts", request);
}

export function updateContact(id: string, request: UpdateContactRequest): Promise<ContactDto> {
  return apiClient.put<ContactDto>(`/contacts/${id}`, request);
}

export function deleteContact(id: string): Promise<void> {
  return apiClient.delete<void>(`/contacts/${id}`);
}

export function getTags(): Promise<TagDto[]> {
  return apiClient.get<TagDto[]>("/contacts/tags");
}

export function createTag(request: CreateTagRequest): Promise<TagDto> {
  return apiClient.post<TagDto>("/contacts/tags", request);
}

export function deleteTag(tagId: string): Promise<void> {
  return apiClient.delete<void>(`/contacts/tags/${tagId}`);
}

export function assignTag(contactId: string, tagId: string): Promise<ContactDto> {
  return apiClient.post<ContactDto>(`/contacts/${contactId}/tags/${tagId}`);
}

export function removeTag(contactId: string, tagId: string): Promise<ContactDto> {
  return apiClient.delete<ContactDto>(`/contacts/${contactId}/tags/${tagId}`);
}

export function sendMassEmail(request: SendMassEmailRequest): Promise<MassEmailResultDto> {
  return apiClient.post<MassEmailResultDto>("/contacts/mass-email", request);
}
