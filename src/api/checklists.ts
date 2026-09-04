import { apiClient, fetchAuthenticatedBlobUrl, uploadFile } from "./client";
import type {
  ChecklistRunDto,
  ChecklistTemplateItemDto,
  CreateChecklistTemplateItemRequest,
  CreateRoomRequest,
  RoomChecklistTemplateDto,
  RoomDto,
  SubmitChecklistRequest,
  UploadAttachmentResponse,
} from "./types";

export function getRooms(): Promise<RoomDto[]> {
  return apiClient.get<RoomDto[]>("/checklists/rooms");
}

export function createRoom(request: CreateRoomRequest): Promise<RoomDto> {
  return apiClient.post<RoomDto>("/checklists/rooms", request);
}

export function addTemplateItem(
  roomId: string,
  request: CreateChecklistTemplateItemRequest,
): Promise<ChecklistTemplateItemDto> {
  return apiClient.post<ChecklistTemplateItemDto>(`/checklists/rooms/${roomId}/items`, request);
}

export function getRoomTemplate(roomId: string): Promise<RoomChecklistTemplateDto> {
  return apiClient.get<RoomChecklistTemplateDto>(`/checklists/rooms/${roomId}/template`);
}

export function submitChecklist(request: SubmitChecklistRequest): Promise<ChecklistRunDto> {
  return apiClient.post<ChecklistRunDto>("/checklists/submit", request);
}

export function uploadChecklistAttachment(file: File): Promise<UploadAttachmentResponse> {
  return uploadFile<UploadAttachmentResponse>("/checklists/attachments", file);
}

export function getChecklistAttachmentUrl(fileName: string): Promise<string> {
  return fetchAuthenticatedBlobUrl(`/checklists/attachments/${fileName}`);
}
