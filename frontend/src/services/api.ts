import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, AuthResponse } from "@/types";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const ACCESS_TOKEN_KEY = "@lojadecarro:accessToken";
export const REFRESH_TOKEN_KEY = "@lojadecarro:refreshToken";
export const USER_KEY = "@lojadecarro:user";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
  refreshQueue.forEach((callback) => callback(token));
  refreshQueue = [];
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        clearSession();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (token) {
              originalRequest._retry = true;
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<ApiResponse<AuthResponse>>(
          `${API_URL}/auth/refresh`,
          { refreshToken }
        );

        const auth = data.data;
        if (!auth) throw new Error("Falha ao renovar sessão");

        localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(auth.user));

        api.defaults.headers.common.Authorization = `Bearer ${auth.accessToken}`;
        resolveQueue(auth.accessToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        resolveQueue(null);
        clearSession();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado"): string {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as ApiResponse<unknown> | undefined;
    if (response?.errors && Array.isArray(response.errors) && response.errors.length > 0) {
      const first = response.errors[0];
      if (typeof first === "string") return first;
    }
    if (response?.message) return response.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
