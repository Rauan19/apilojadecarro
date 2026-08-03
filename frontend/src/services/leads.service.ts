import { api } from "./api";
import type {
  ApiResponse,
  CreateLeadPayload,
  Lead,
  LeadStatus,
  PaginatedResult,
  PaginationParams,
  UpdateLeadPayload,
} from "@/types";

export const leadsService = {
  async list(params: PaginationParams) {
    const { data } = await api.get<ApiResponse<PaginatedResult<Lead>>>("/leads", { params });
    return data.data as PaginatedResult<Lead>;
  },

  async getById(id: string, companyId?: string) {
    const { data } = await api.get<ApiResponse<Lead>>(`/leads/${id}`, { params: { companyId } });
    return data.data as Lead;
  },

  async create(payload: CreateLeadPayload, companyId?: string) {
    const { data } = await api.post<ApiResponse<Lead>>("/leads", payload, { params: { companyId } });
    return data.data as Lead;
  },

  async update(id: string, payload: UpdateLeadPayload, companyId?: string) {
    const { data } = await api.patch<ApiResponse<Lead>>(`/leads/${id}`, payload, { params: { companyId } });
    return data.data as Lead;
  },

  async updateStatus(id: string, status: LeadStatus, companyId?: string) {
    const { data } = await api.patch<ApiResponse<Lead>>(
      `/leads/${id}/status`,
      { status },
      { params: { companyId } }
    );
    return data.data as Lead;
  },

  async remove(id: string, companyId?: string) {
    await api.delete<ApiResponse<Lead>>(`/leads/${id}`, { params: { companyId } });
  },
};
