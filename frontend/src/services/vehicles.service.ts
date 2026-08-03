import { api } from "./api";
import type {
  ApiResponse,
  CreateVehiclePayload,
  PaginatedResult,
  PaginationParams,
  UpdateVehiclePayload,
  Vehicle,
  VehicleImage,
} from "@/types";

export const vehiclesService = {
  async list(params: PaginationParams) {
    const { data } = await api.get<ApiResponse<PaginatedResult<Vehicle>>>("/vehicles", { params });
    return data.data as PaginatedResult<Vehicle>;
  },

  async getById(id: string, companyId?: string) {
    const { data } = await api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`, { params: { companyId } });
    return data.data as Vehicle;
  },

  async create(payload: CreateVehiclePayload, companyId?: string) {
    const { data } = await api.post<ApiResponse<Vehicle>>("/vehicles", payload, { params: { companyId } });
    return data.data as Vehicle;
  },

  async update(id: string, payload: UpdateVehiclePayload, companyId?: string) {
    const { data } = await api.patch<ApiResponse<Vehicle>>(`/vehicles/${id}`, payload, { params: { companyId } });
    return data.data as Vehicle;
  },

  async remove(id: string, companyId?: string) {
    await api.delete<ApiResponse<Vehicle>>(`/vehicles/${id}`, { params: { companyId } });
  },

  async addImages(id: string, files: File[], companyId?: string) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const { data } = await api.post<ApiResponse<VehicleImage[]>>(`/vehicles/${id}/images`, formData, {
      params: { companyId },
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as VehicleImage[];
  },

  async removeImage(vehicleId: string, imageId: string, companyId?: string) {
    await api.delete<ApiResponse<VehicleImage>>(`/vehicles/${vehicleId}/images/${imageId}`, {
      params: { companyId },
    });
  },
};
