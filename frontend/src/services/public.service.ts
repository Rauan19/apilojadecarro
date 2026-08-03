import axios from "axios";
import { API_URL } from "./api";
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

export const DEMO_API_TOKEN = import.meta.env.VITE_DEMO_API_TOKEN || "";
export const PUBLIC_API_TOKEN = import.meta.env.VITE_PUBLIC_API_TOKEN || "";

function client(token?: string) {
  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export const publicService = {
  async getCompanyInfo(token?: string) {
    const { data } = await client(token).get<ApiResponse<PublicCompanyInfo>>("/public/company");
    return data.data as PublicCompanyInfo;
  },

  async getVehicles(filters: PublicVehicleFilters, token?: string) {
    const { data } = await client(token).get<ApiResponse<PaginatedResult<Vehicle>>>("/public/vehicles", {
      params: filters,
    });
    return data.data as PaginatedResult<Vehicle>;
  },

  async getVehicleById(id: string, token?: string) {
    const { data } = await client(token).get<ApiResponse<Vehicle>>(`/public/vehicles/${id}`);
    return data.data as Vehicle;
  },

  async createLead(payload: CreatePublicLeadPayload, token?: string) {
    const { data } = await client(token).post<ApiResponse<Lead>>("/public/leads", payload);
    return data.data as Lead;
  },

  async createSchedule(payload: CreatePublicSchedulePayload, token?: string) {
    const { data } = await client(token).post<ApiResponse<Schedule>>("/public/schedule", payload);
    return data.data as Schedule;
  },
};
