import { api } from "@/lib/api";

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  price: number;
  durationMin: number;
  active: boolean;
}

export interface CreateServiceData {
  name: string;
  price: number;
  durationMin: number;
}

export const servicesService = {
  list: () => api.get<Service[]>("/services"),

  create: (data: CreateServiceData) =>
    api.post<Service>("/services", data),

  update: (id: string, data: Partial<CreateServiceData>) =>
    api.patch<Service>(`/services/${id}`, data),

  deactivate: (id: string) =>
    api.delete(`/services/${id}`),
};
