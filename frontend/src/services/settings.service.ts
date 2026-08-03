import { api } from "./api";
import type { ApiResponse, CompanySettings, UpdateSettingsPayload } from "@/types";

export const settingsService = {
  async get(companyId?: string) {
    const { data } = await api.get<ApiResponse<CompanySettings>>("/settings", { params: { companyId } });
    return data.data as CompanySettings;
  },

  async update(payload: UpdateSettingsPayload, companyId?: string) {
    const { data } = await api.patch<ApiResponse<CompanySettings>>("/settings", payload, {
      params: { companyId },
    });
    return data.data as CompanySettings;
  },
};
