import { api } from "./api";
import type { ApiLog, ApiResponse, PaginatedResult, PaginationParams } from "@/types";

export interface LogsFilterParams extends PaginationParams {
  endpoint?: string;
  companyId?: string;
}

export const logsService = {
  async listApiLogs(params: LogsFilterParams) {
    const { data } = await api.get<ApiResponse<PaginatedResult<ApiLog>>>("/logs/api", { params });
    return data.data as PaginatedResult<ApiLog>;
  },
};
