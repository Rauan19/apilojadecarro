import { api } from "./api";
import type {
  ApiResponse,
  CreateSellerPayload,
  PaginatedResult,
  PaginationParams,
  Seller,
  UpdateSellerPayload,
} from "@/types";

export const sellersService = {
  async list(params: PaginationParams) {
    const { data } = await api.get<ApiResponse<PaginatedResult<Seller>>>("/sellers", { params });
    return data.data as PaginatedResult<Seller>;
  },

  async getById(id: string, companyId?: string) {
    const { data } = await api.get<ApiResponse<Seller>>(`/sellers/${id}`, { params: { companyId } });
    return data.data as Seller;
  },

  async create(payload: CreateSellerPayload, companyId?: string) {
    const { data } = await api.post<ApiResponse<Seller>>("/sellers", payload, { params: { companyId } });
    return data.data as Seller;
  },

  async update(id: string, payload: UpdateSellerPayload, companyId?: string) {
    const { data } = await api.patch<ApiResponse<Seller>>(`/sellers/${id}`, payload, { params: { companyId } });
    return data.data as Seller;
  },

  async remove(id: string, companyId?: string) {
    await api.delete<ApiResponse<Seller>>(`/sellers/${id}`, { params: { companyId } });
  },
};
