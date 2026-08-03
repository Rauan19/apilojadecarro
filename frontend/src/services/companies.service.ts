import { api } from "./api";
import type {
  ApiResponse,
  Company,
  CompanyStatsOverview,
  CreateCompanyPayload,
  CreateCompanyResult,
  PaginatedResult,
  PaginationParams,
  PasswordChangeLinkResult,
  UpdateCompanyPayload,
} from "@/types";

export const companiesService = {
  async list(params: PaginationParams) {
    const { data } = await api.get<ApiResponse<PaginatedResult<Company>>>("/companies", { params });
    return data.data as PaginatedResult<Company>;
  },

  async getStatsOverview() {
    const { data } = await api.get<ApiResponse<CompanyStatsOverview>>("/companies/stats/overview");
    return data.data as CompanyStatsOverview;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<Company>>(`/companies/${id}`);
    return data.data as Company;
  },

  async create(payload: CreateCompanyPayload) {
    const { data } = await api.post<ApiResponse<CreateCompanyResult>>("/companies", payload);
    return data.data as CreateCompanyResult;
  },

  async update(id: string, payload: UpdateCompanyPayload) {
    const { data } = await api.patch<ApiResponse<Company>>(`/companies/${id}`, payload);
    return data.data as Company;
  },

  async remove(id: string) {
    await api.delete<ApiResponse<Company>>(`/companies/${id}`);
  },

  async block(id: string) {
    const { data } = await api.patch<ApiResponse<Company>>(`/companies/${id}/block`);
    return data.data as Company;
  },

  async activate(id: string) {
    const { data } = await api.patch<ApiResponse<Company>>(`/companies/${id}/activate`);
    return data.data as Company;
  },

  async changePlan(id: string, planId: string) {
    const { data } = await api.patch<ApiResponse<Company>>(`/companies/${id}/plan`, { planId });
    return data.data as Company;
  },

  async createPasswordChangeLink(id: string) {
    const { data } = await api.post<ApiResponse<PasswordChangeLinkResult>>(
      `/companies/${id}/password-change-link`,
    );
    return data.data as PasswordChangeLinkResult;
  },
};
