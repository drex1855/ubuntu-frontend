import { apiClient } from "./client";
import type {
  CreateProductRequest,
  ModelDebtDto,
  ProductDto,
  RegisterDebtPaymentRequest,
  RegisterSaleRequest,
  StoreSaleDto,
  UpdateProductRequest,
} from "./types";

export function getProducts(): Promise<ProductDto[]> {
  return apiClient.get<ProductDto[]>("/inventory/products");
}

export function createProduct(request: CreateProductRequest): Promise<ProductDto> {
  return apiClient.post<ProductDto>("/inventory/products", request);
}

export function updateProduct(id: string, request: UpdateProductRequest): Promise<ProductDto> {
  return apiClient.put<ProductDto>(`/inventory/products/${id}`, request);
}

export function deleteProduct(id: string): Promise<void> {
  return apiClient.delete<void>(`/inventory/products/${id}`);
}

export function getSales(modelAccountId?: string): Promise<StoreSaleDto[]> {
  return apiClient.get<StoreSaleDto[]>("/inventory/sales", { modelAccountId });
}

export function registerSale(request: RegisterSaleRequest): Promise<StoreSaleDto> {
  return apiClient.post<StoreSaleDto>("/inventory/sales", request);
}

export function registerDebtPayment(request: RegisterDebtPaymentRequest): Promise<void> {
  return apiClient.post<void>("/inventory/payments", request);
}

export function getDebts(): Promise<ModelDebtDto[]> {
  return apiClient.get<ModelDebtDto[]>("/inventory/debts");
}

export function getMyDebt(): Promise<ModelDebtDto> {
  return apiClient.get<ModelDebtDto>("/inventory/debts/me");
}
