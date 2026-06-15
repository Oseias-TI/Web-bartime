import { api } from "@/lib/api";

export interface PlatformStats {
  tenants: {
    total: number;
    active: number;
    trial: number;
    pastDue: number;
    canceled: number;
  };
  revenue: {
    total: string;
    thisMonth: string;
    mrr: string;
  };
  newTenantsThisMonth: number;
  totalAppointments: number;
  totalProfessionals: number;
  totalClients: number;
  chartData: Array<{
    name: string;
    novasBarbearias: number;
    agendamentos: number;
    gmv: number;
  }>;
  topTenants: Array<{
    id: string;
    name: string;
    cnpj: string;
    totalAmount: number;
  }>;
}

export interface TenantListResult {
  data: Array<{
    id: string;
    name: string;
    cnpj: string;
    subscriptionStatus: string;
    createdAt: string;
    professionalsCount: number;
    clientsCount: number;
    appointmentsCount: number;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const superAdminService = {
  getStats: async (filter?: string) => {
    const res = await api.get<PlatformStats>("/super-admin/stats", filter ? { filter } : undefined);
    return res;
  },

  listTenants: async (params?: { search?: string; page?: number; limit?: number; status?: string }) => {
    const res = await api.get<TenantListResult>("/super-admin/tenants", params as Record<string, string>);
    return res;
  },

  createTenant: async (data: { name: string; cnpj: string; slug: string }) => {
    const res = await api.post<any>("/super-admin/tenants", data);
    return res;
  },

  updateTenant: async (id: string, data: { name?: string; cnpj?: string; slug?: string }) => {
    const res = await api.put<any>(`/super-admin/tenants/${id}`, data);
    return res;
  },

  deleteTenant: async (id: string) => {
    const res = await api.delete<any>(`/super-admin/tenants/${id}`);
    return res;
  },

  updateTenantStatus: async (id: string, status: string) => {
    const res = await api.patch<{ message: string; tenant: any }>(`/super-admin/tenants/${id}/status`, { status });
    return res;
  },

  listUsers: async (params?: { search?: string; page?: number; limit?: number }) => {
    const res = await api.get<{
      data: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        active: boolean;
        avatarUrl: string | null;
        createdAt: string;
        tenant: { id: string; name: string } | null;
      }>;
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>("/super-admin/users", params as Record<string, string>);
    return res;
  },

  updateUserStatus: async (id: string, active: boolean) => {
    const res = await api.patch<{ message: string; user: any }>(`/super-admin/users/${id}/status`, { active });
    return res;
  },

  updateUserPassword: async (id: string, password: string) => {
    const res = await api.patch<{ message: string; user: any }>(`/super-admin/users/${id}/password`, { password });
    return res;
  },

  updateUserEmail: async (id: string, email: string) => {
    const res = await api.patch<{ message: string; user: any }>(`/super-admin/users/${id}/email`, { email });
    return res;
  },
};
