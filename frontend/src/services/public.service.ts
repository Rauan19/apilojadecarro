import { API_URL } from "./api";
import axios from "axios";
import type {
  ApiResponse,
  CreatePublicLeadPayload,
  CreatePublicSchedulePayload,
  PaginatedResult,
  PublicCompanyInfo,
  PublicVehicleFilters,
  Schedule,
  Vehicle,
  Lead,
} from "@/types";

/** Cliente HTTP da vitrine multi-tenant (sem ApiToken). */
function storeClient() {
  return axios.create({ baseURL: API_URL });
}

/**
 * Token da API pública: apenas para sites externos / integrações.
 * A vitrine `/loja/:slug` do sistema NÃO usa isso.
 */
export const DEMO_API_TOKEN = import.meta.env.VITE_DEMO_API_TOKEN || "";
export const PUBLIC_API_TOKEN = import.meta.env.VITE_PUBLIC_API_TOKEN || "";

function tokenClient(token?: string) {
  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export const publicService = {
  async resolveByHost(host: string) {
    const { data } = await storeClient().get<
      ApiResponse<{ id: string; slug: string; name: string; customDomain: string | null }>
    >("/store/resolve", { params: { host } });
    return data.data;
  },

  async getCompanyBySlug(slug: string) {
    const { data } = await storeClient().get<ApiResponse<PublicCompanyInfo>>(
      `/store/${encodeURIComponent(slug)}/company`
    );
    return data.data as PublicCompanyInfo;
  },

  async getVehiclesBySlug(slug: string, filters: PublicVehicleFilters) {
    const { data } = await storeClient().get<ApiResponse<PaginatedResult<Vehicle>>>(
      `/store/${encodeURIComponent(slug)}/vehicles`,
      { params: filters }
    );
    return data.data as PaginatedResult<Vehicle>;
  },

  async getVehicleBySlug(slug: string, id: string) {
    const { data } = await storeClient().get<ApiResponse<Vehicle>>(
      `/store/${encodeURIComponent(slug)}/vehicles/${id}`
    );
    return data.data as Vehicle;
  },

  async createLeadBySlug(slug: string, payload: CreatePublicLeadPayload) {
    const { data } = await storeClient().post<ApiResponse<Lead>>(
      `/store/${encodeURIComponent(slug)}/leads`,
      payload
    );
    return data.data as Lead;
  },

  async createScheduleBySlug(slug: string, payload: CreatePublicSchedulePayload) {
    const { data } = await storeClient().post<ApiResponse<Schedule>>(
      `/store/${encodeURIComponent(slug)}/schedule`,
      payload
    );
    return data.data as Schedule;
  },

  /** @deprecated Use getCompanyBySlug (mantido para integrações com token) */
  async getCompanyInfo(token?: string) {
    const { data } = await tokenClient(token).get<ApiResponse<PublicCompanyInfo>>("/public/company");
    return data.data as PublicCompanyInfo;
  },

  async getVehicles(filters: PublicVehicleFilters, token?: string) {
    const { data } = await tokenClient(token).get<ApiResponse<PaginatedResult<Vehicle>>>("/public/vehicles", {
      params: filters,
    });
    return data.data as PaginatedResult<Vehicle>;
  },

  async getVehicleById(id: string, token?: string) {
    const { data } = await tokenClient(token).get<ApiResponse<Vehicle>>(`/public/vehicles/${id}`);
    return data.data as Vehicle;
  },

  async createLead(payload: CreatePublicLeadPayload, token?: string) {
    const { data } = await tokenClient(token).post<ApiResponse<Lead>>("/public/leads", payload);
    return data.data as Lead;
  },

  async createSchedule(payload: CreatePublicSchedulePayload, token?: string) {
    const { data } = await tokenClient(token).post<ApiResponse<Schedule>>("/public/schedule", payload);
    return data.data as Schedule;
  },
};
