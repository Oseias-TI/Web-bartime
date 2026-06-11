import { api } from "@/lib/api";

export interface BillingStatus {
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  plan: string | null;
}

export const billingService = {
  getStatus: () => api.get<BillingStatus>("/billing/status"),

  createCheckout: () =>
    api.post<{ url: string }>("/billing/checkout"),

  createPortal: () =>
    api.post<{ url: string }>("/billing/portal"),
};
