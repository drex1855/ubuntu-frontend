// Tipos espejo de los DTOs y enums del backend (WebcamStudio.Application / Domain).
// Los enums viajan como string por JsonStringEnumConverter (ver Program.cs del backend).

export type QueryValue = string | number | boolean | undefined | null;

export type AccountRole = "Admin" | "Modelo" | "Monitor";
export type AccountStatus = "Activo" | "Desactivado";
export type AccountGender = "Femenino" | "Masculino" | "Otro";
export type ChecklistItemStatus = "Bueno" | "Malo";
export type MaintenanceRequestStatus = "Pendiente" | "EnProceso" | "Resuelta";
export type LoanRequestStatus = "Pendiente" | "Aprobada" | "Rechazada";

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data?: T | null;
  errors: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  accountId: string;
  fullName: string;
  role: AccountRole;
}

export interface ModelAccountDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: AccountRole;
  status: AccountStatus;
  gender?: AccountGender | null;
  createdAt: string;
}

export interface CreateModelAccountRequest {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  password: string;
  role: AccountRole;
  gender?: AccountGender | null;
}

export interface UpdateModelAccountRequest {
  fullName: string;
  phoneNumber?: string | null;
  gender?: AccountGender | null;
}

export interface UpdateAccountStatusRequest {
  status: AccountStatus;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface ProductDto {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface CreateProductRequest {
  name: string;
  price: number;
}

export interface UpdateProductRequest {
  name: string;
  price: number;
}

export interface RegisterSaleRequest {
  productId: string;
  modelAccountId: string;
  quantity: number;
  isCredit: boolean;
}

export interface StoreSaleDto {
  id: string;
  productId: string;
  productName: string;
  modelAccountId: string;
  modelFullName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  isCredit: boolean;
  soldAt: string;
}

export interface RegisterDebtPaymentRequest {
  modelAccountId: string;
  amount: number;
}

export interface ModelDebtDto {
  modelAccountId: string;
  modelFullName: string;
  totalDebt: number;
}

export interface SiteDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  tokenValueUsd: number;
}

export interface CreateSiteRequest {
  name: string;
  description?: string | null;
  tokenValueUsd: number;
}

export interface UpdateSiteRequest {
  name: string;
  description?: string | null;
  tokenValueUsd: number;
}

export interface CreateTokenReportRequest {
  modelAccountId: string;
  siteId: string;
  period: string; // yyyy-MM-dd
  tokensAmount: number;
}

export interface TokenReportDto {
  id: string;
  modelAccountId: string;
  modelFullName: string;
  siteId: string;
  siteName: string;
  period: string;
  tokensAmount: number;
  monetaryValue: number;
  registeredAt: string;
}

export interface TokenSummaryDto {
  modelAccountId: string;
  modelFullName: string;
  siteId: string;
  siteName: string;
  totalTokens: number;
  totalMonetaryValue: number;
  reportsCount: number;
}

export interface TokenReportSearchParams {
  modelAccountId?: string;
  siteId?: string;
  periodFrom?: string;
  periodTo?: string;
  [key: string]: QueryValue;
}

export interface RoomDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface CreateRoomRequest {
  name: string;
  description?: string | null;
}

export interface ChecklistTemplateItemDto {
  id: string;
  name: string;
  description?: string | null;
  displayOrder: number;
}

export interface CreateChecklistTemplateItemRequest {
  name: string;
  description?: string | null;
  displayOrder: number;
}

export interface RoomChecklistTemplateDto {
  room: RoomDto;
  items: ChecklistTemplateItemDto[];
}

export interface SubmitChecklistItemResultRequest {
  templateItemId: string;
  status: ChecklistItemStatus;
  observation?: string | null;
  attachmentFileName?: string | null;
  attachmentContentType?: string | null;
}

export interface SubmitChecklistRequest {
  roomId: string;
  items: SubmitChecklistItemResultRequest[];
  availableMaterialsNotes?: string | null;
  materialsAttachmentFileName?: string | null;
  materialsAttachmentContentType?: string | null;
}

export interface ChecklistItemResultDto {
  templateItemId: string;
  templateItemName: string;
  status: ChecklistItemStatus;
  observation?: string | null;
  attachmentFileName?: string | null;
}

export interface UploadAttachmentResponse {
  fileName: string;
}

export interface MaintenanceRequestDto {
  id: string;
  description: string;
  status: MaintenanceRequestStatus;
  createdAt: string;
}

export interface ChecklistRunDto {
  id: string;
  roomId: string;
  roomName: string;
  performedByAccountId: string;
  performedAt: string;
  availableMaterialsNotes?: string | null;
  materialsAttachmentFileName?: string | null;
  items: ChecklistItemResultDto[];
  maintenanceRequests: MaintenanceRequestDto[];
}

// ---- Contactos (quien escribe al WhatsApp del estudio desde la pagina publica) ----

export interface TagDto {
  id: string;
  name: string;
}

export interface CreateTagRequest {
  name: string;
}

export interface ContactDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  notes?: string | null;
  source: string;
  consentGiven: boolean;
  consentGivenAt: string;
  createdAt: string;
  tags: TagDto[];
}

export interface CreatePublicContactRequest {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  consent: boolean;
}

export interface CreateContactRequest {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  notes?: string | null;
}

export interface UpdateContactRequest {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  notes?: string | null;
}

export interface ContactSearchParams {
  search?: string;
  tagId?: string;
  hasEmail?: boolean;
  [key: string]: QueryValue;
}

export interface SendMassEmailRequest {
  subject: string;
  body: string;
  contactIds?: string[] | null;
  tagId?: string | null;
}

export interface MassEmailResultDto {
  recipients: number;
  sent: number;
  skippedNoEmail: number;
}

// ---- Préstamos ----

export interface LoanRequestDto {
  id: string;
  requestedByAccountId: string;
  requestedByFullName: string;
  amount: number;
  reason: string;
  status: LoanRequestStatus;
  requestedAt: string;
  resolvedAt?: string | null;
}

export interface CreateLoanRequestRequest {
  amount: number;
  reason: string;
}

export interface UpdateLoanRequestStatusRequest {
  status: LoanRequestStatus;
}

export interface LoanRequestSearchParams {
  status?: LoanRequestStatus;
  [key: string]: QueryValue;
}

// ---- Multas ----

export type FineStatus = "PendientePorCobrar" | "Pagada" | "Cancelada";

export interface FineDto {
  id: string;
  modelAccountId: string;
  modelFullName: string;
  amount: number;
  reason: string;
  status: FineStatus;
  issuedAt: string;
  resolvedAt?: string | null;
}

export interface CreateFineRequest {
  modelAccountId: string;
  amount: number;
  reason: string;
}

export interface UpdateFineStatusRequest {
  status: FineStatus;
}

export interface FineSearchParams {
  modelAccountId?: string;
  status?: FineStatus;
  [key: string]: QueryValue;
}

// ---- Horas ----

export interface HourEntryDto {
  id: string;
  modelAccountId: string;
  modelFullName: string;
  minutes: number;
  note?: string | null;
  registeredAt: string;
}

export interface CreateHourEntryRequest {
  modelAccountId: string;
  minutes: number;
  note?: string | null;
}

export interface HourEntrySearchParams {
  modelAccountId?: string;
  [key: string]: QueryValue;
}
