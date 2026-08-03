import { api } from "./api";
import type { ApiResponse, AuthResponse, AuthUser } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/login", payload);
    return data.data as AuthResponse;
  },

  async refresh(refreshToken: string) {
    const { data } = await api.post<ApiResponse<AuthResponse>>("/auth/refresh", { refreshToken });
    return data.data as AuthResponse;
  },

  async logout(refreshToken?: string) {
    await api.post<ApiResponse<null>>("/auth/logout", { refreshToken });
  },

  async me() {
    const { data } = await api.get<ApiResponse<AuthUser>>("/auth/me");
    return data.data as AuthUser;
  },

  async validatePasswordReset(token: string) {
    const { data } = await api.post<
      ApiResponse<{ valid: boolean; email?: string; name?: string }>
    >("/auth/password-reset/validate", { token });
    return data.data as { valid: boolean; email?: string; name?: string };
  },

  async confirmPasswordReset(token: string, newPassword: string) {
    await api.post<ApiResponse<null>>("/auth/password-reset/confirm", {
      token,
      newPassword,
    });
  },
};
