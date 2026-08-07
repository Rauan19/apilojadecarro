import { api } from "./api";
import type { ApiResponse, SubscriptionPlan } from "@/types";

export type SubscriptionStatus = "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
export type InvoiceStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELED" | "REFUNDED";

export interface Invoice {
  id: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixTicketUrl: string | null;
  pixExpiresAt: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  method: string;
  plan: { id: string; name: string; slug: string; priceMonthly: number };
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextChargeAt: string | null;
  graceUntil: string | null;
  canceledAt: string | null;
  daysRemaining: number | null;
  companyStatus: "ACTIVE" | "BLOCKED" | "INACTIVE";
  /** true = bloqueio por inadimplência (pagar resolve); false = bloqueio manual. */
  blockedByBilling: boolean;
  openInvoice: Invoice | null;
}

export const billingService = {
  /** Planos ativos visíveis para a loja (o CRUD /plans é só do Super Admin). */
  async listPlans() {
    const { data } = await api.get<ApiResponse<SubscriptionPlan[]>>("/billing/plans");
    return (data.data ?? []) as SubscriptionPlan[];
  },

  async getSubscription(companyId?: string) {
    const { data } = await api.get<ApiResponse<Subscription | null>>("/billing/subscription", {
      params: { companyId },
    });
    return data.data ?? null;
  },

  async listInvoices(companyId?: string) {
    const { data } = await api.get<ApiResponse<Invoice[]>>("/billing/invoices", {
      params: { companyId },
    });
    return (data.data ?? []) as Invoice[];
  },

  async subscribe(planId: string, companyId?: string) {
    const { data } = await api.post<ApiResponse<Subscription>>(
      "/billing/subscribe",
      { planId },
      { params: { companyId } }
    );
    return data.data as Subscription;
  },

  async refreshPix(invoiceId: string, companyId?: string) {
    const { data } = await api.post<ApiResponse<Invoice>>(
      `/billing/invoices/${invoiceId}/pix`,
      undefined,
      { params: { companyId } }
    );
    return data.data as Invoice;
  },

  async cancel(companyId?: string) {
    const { data } = await api.post<ApiResponse<Subscription>>("/billing/cancel", undefined, {
      params: { companyId },
    });
    return data.data as Subscription;
  },
};
