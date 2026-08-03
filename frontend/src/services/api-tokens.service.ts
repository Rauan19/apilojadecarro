import { api } from "./api";
import type { ApiResponse, ApiToken, CreateApiTokenPayload } from "@/types";

export const apiTokensService = {
  async listByCompany(companyId: string) {
    const { data } = await api.get<ApiResponse<ApiToken[]>>("/api-tokens", { params: { companyId } });
    return data.data as ApiToken[];
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<ApiToken>>(`/api-tokens/${id}`);
    return data.data as ApiToken;
  },

  async create(payload: CreateApiTokenPayload) {
    const { data } = await api.post<ApiResponse<ApiToken>>("/api-tokens", payload);
    return data.data as ApiToken;
  },

  async revoke(id: string) {
    const { data } = await api.patch<ApiResponse<ApiToken>>(`/api-tokens/${id}/revoke`);
    return data.data as ApiToken;
  },

  async remove(id: string) {
    await api.delete<ApiResponse<ApiToken>>(`/api-tokens/${id}`);
  },
};
