import { api } from "@/lib/api";
import type { Professional } from "@/contexts/AuthContext";

export interface CreateProfessionalData {
  name: string;
  email: string;
  password: string;
  role: "BARBER" | "RECEPTIONIST";
  commissionRate?: number;
}

export const professionalsService = {
  list: async () => {
    const res = await api.get<{ data: Professional[] }>("/professionals");
    return res.data;
  },

  show: (id: string) => api.get<Professional>(`/professionals/${id}`),

  create: (data: CreateProfessionalData) =>
    api.post<Professional>("/professionals", data),

  update: (id: string, data: Partial<CreateProfessionalData>) =>
    api.patch<Professional>(`/professionals/${id}`, data),

  deactivate: (id: string) =>
    api.delete(`/professionals/${id}`),

  updateAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.patch<{ avatarUrl: string }>("/professionals/avatar", formData);
  },
};
