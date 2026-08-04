import { api } from "./api";
import type { ApiResponse } from "@/types";

export interface UploadImageResult {
  filename: string;
  originalName: string;
  url: string;
  path: string;
  mimetype: string;
  size: number;
}

export const uploadsService = {
  async uploadImage(file: File, companyId?: string) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<ApiResponse<UploadImageResult>>("/uploads/image", form, {
      params: companyId ? { companyId } : undefined,
    });
    return data.data as UploadImageResult;
  },
};
