import { api } from "./api";
import type {
  ApiResponse,
  CreateUserPayload,
  PaginatedResult,
  UpdateUserPayload,
  User,
  UsersListParams,
} from "@/types";

export const usersService = {
  async list(params: UsersListParams) {
    const { data } = await api.get<ApiResponse<PaginatedResult<User>>>("/users", { params });
    return data.data as PaginatedResult<User>;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data.data as User;
  },

  async create(payload: CreateUserPayload) {
    const { data } = await api.post<ApiResponse<User>>("/users", payload);
    return data.data as User;
  },

  async update(id: string, payload: UpdateUserPayload) {
    const { data } = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
    return data.data as User;
  },

  async remove(id: string) {
    await api.delete<ApiResponse<User>>(`/users/${id}`);
  },
};
