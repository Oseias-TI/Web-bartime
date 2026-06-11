import { api } from "@/lib/api";

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  preferences: string | null;
  loyaltyPoints: number;
  createdAt: string;
}

export interface ClientProfile extends Client {
  totalAppointments: number;
  lastVisit: string | null;
  appointments: Array<{
    id: string;
    startTime: string;
    status: string;
    service: { name: string; price: number };
    professional: { name: string };
  }>;
}

export interface ClientSpending {
  totalSpent: number;
  averageTicket: number;
  monthlySpending: Array<{ month: string; total: number }>;
}

export interface CreateClientData {
  name: string;
  phone: string;
  email?: string;
  preferences?: string;
}

export const clientsService = {
  list: async (search?: string) => {
    const res = await api.get<{ data: Client[] }>("/clients", search ? { search } : {});
    return res.data;
  },

  listInactive: () =>
    api.get<Client[]>("/clients/inactive"),

  getProfile: (id: string) =>
    api.get<ClientProfile>(`/clients/${id}/profile`),

  getSpending: (id: string) =>
    api.get<ClientSpending>(`/clients/${id}/spending`),

  create: (data: CreateClientData) =>
    api.post<Client>("/clients", data),

  update: (id: string, data: Partial<CreateClientData>) =>
    api.patch<Client>(`/clients/${id}`, data),

  redeemPoints: (id: string, points: number) =>
    api.post(`/clients/${id}/redeem`, { points }),
};
