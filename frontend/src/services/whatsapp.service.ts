import { api } from "./api";
import type { ApiResponse } from "@/types";

export interface WhatsappStatus {
  connected: boolean;
  status: string;
  instanceName: string | null;
  qrcode: string | null;
  botEnabled: boolean;
}

export const whatsappService = {
  async getStatus(companyId?: string) {
    const { data } = await api.get<ApiResponse<WhatsappStatus>>("/whatsapp/status", {
      params: { companyId },
    });
    return data.data as WhatsappStatus;
  },

  async connect(companyId?: string) {
    const { data } = await api.post<ApiResponse<WhatsappStatus>>(
      "/whatsapp/connect",
      undefined,
      { params: { companyId } }
    );
    return data.data as WhatsappStatus;
  },

  async disconnect(companyId?: string) {
    const { data } = await api.delete<ApiResponse<WhatsappStatus>>("/whatsapp/disconnect", {
      params: { companyId },
    });
    return data.data as WhatsappStatus;
  },

  async setBotEnabled(enabled: boolean, companyId?: string) {
    const { data } = await api.patch<ApiResponse<WhatsappStatus>>(
      "/whatsapp/bot-enabled",
      { enabled },
      { params: { companyId } }
    );
    return data.data as WhatsappStatus;
  },
};
