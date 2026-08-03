import { api } from "./api";
import type {
  ApiResponse,
  CreateProposalPayload,
  PaginatedResult,
  PaginationParams,
  Proposal,
  UpdateProposalPayload,
} from "@/types";

export const proposalsService = {
  async list(params: PaginationParams) {
    const { data } = await api.get<ApiResponse<PaginatedResult<Proposal>>>("/proposals", { params });
    return data.data as PaginatedResult<Proposal>;
  },

  async getById(id: string, companyId?: string) {
    const { data } = await api.get<ApiResponse<Proposal>>(`/proposals/${id}`, { params: { companyId } });
    return data.data as Proposal;
  },

  async create(payload: CreateProposalPayload, companyId?: string) {
    const { data } = await api.post<ApiResponse<Proposal>>("/proposals", payload, { params: { companyId } });
    return data.data as Proposal;
  },

  async update(id: string, payload: UpdateProposalPayload, companyId?: string) {
    const { data } = await api.patch<ApiResponse<Proposal>>(`/proposals/${id}`, payload, { params: { companyId } });
    return data.data as Proposal;
  },

  async remove(id: string, companyId?: string) {
    await api.delete<ApiResponse<Proposal>>(`/proposals/${id}`, { params: { companyId } });
  },
};
