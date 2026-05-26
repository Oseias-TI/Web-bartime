import { api } from "@/lib/api";

export interface Tenant {
  id: string;
  name: string;
  cnpj: string;
  logoUrl: string | null;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
}

export interface BusinessHour {
  id: string;
  dayOfWeek: number;
  open: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export const tenantService = {
  get: () => api.get<Tenant>("/tenant"),

  update: (data: { name?: string; cnpj?: string }) =>
    api.patch<Tenant>("/tenant", data),

  updateLogo: (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    return api.patch<{ logoUrl: string }>("/tenant/logo", formData);
  },

  getBusinessHours: () =>
    api.get<BusinessHour[]>("/business-hours"),

  updateBusinessHours: (hours: Omit<BusinessHour, "id">[]) =>
    api.put<BusinessHour[]>("/business-hours", { hours }),
};
