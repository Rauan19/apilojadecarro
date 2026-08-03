import { api } from "./api";
import type {
  ApiResponse,
  CreateCustomerPayload,
  Customer,
  PaginatedResult,
  PaginationParams,
  UpdateCustomerPayload,
} from "@/types";

export const customersService = {
  async list(params: PaginationParams) {
    const { data } = await api.get<ApiResponse<PaginatedResult<Customer>>>("/customers", { params });
    return data.data as PaginatedResult<Customer>;
  },

  async getById(id: string, companyId?: string) {
    const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`, { params: { companyId } });
    return data.data as Customer;
  },

  async create(payload: CreateCustomerPayload, companyId?: string) {
    const { data } = await api.post<ApiResponse<Customer>>("/customers", payload, { params: { companyId } });
    return data.data as Customer;
  },

  async update(id: string, payload: UpdateCustomerPayload, companyId?: string) {
    const { data } = await api.patch<ApiResponse<Customer>>(`/customers/${id}`, payload, { params: { companyId } });
    return data.data as Customer;
  },

  async remove(id: string, companyId?: string) {
    await api.delete<ApiResponse<Customer>>(`/customers/${id}`, { params: { companyId } });
  },
};
