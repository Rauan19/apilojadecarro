import { api } from "./api";
import type { ApiResponse, DashboardData } from "@/types";

export const dashboardService = {
  async get() {
    const { data } = await api.get<ApiResponse<DashboardData>>("/dashboard");
    return data.data as DashboardData;
  },
};
