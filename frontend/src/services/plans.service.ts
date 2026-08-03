import { api } from "./api";
import type { ApiResponse, CreatePlanPayload, SubscriptionPlan, UpdatePlanPayload } from "@/types";

export const plansService = {
  async list(activeOnly = false) {
    const { data } = await api.get<ApiResponse<SubscriptionPlan[]>>("/plans", {
      params: activeOnly ? { activeOnly: true } : undefined,
    });
    return data.data as SubscriptionPlan[];
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<SubscriptionPlan>>(`/plans/${id}`);
    return data.data as SubscriptionPlan;
  },

  async create(payload: CreatePlanPayload) {
    const { data } = await api.post<ApiResponse<SubscriptionPlan>>("/plans", payload);
    return data.data as SubscriptionPlan;
  },

  async update(id: string, payload: UpdatePlanPayload) {
    const { data } = await api.patch<ApiResponse<SubscriptionPlan>>(`/plans/${id}`, payload);
    return data.data as SubscriptionPlan;
  },

  async remove(id: string) {
    await api.delete<ApiResponse<SubscriptionPlan>>(`/plans/${id}`);
  },
};
