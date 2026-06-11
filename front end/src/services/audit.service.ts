import { api } from "@/lib/api";

export interface AuditLog {
  id: string;
  tenantId: string | null;
  professionalId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export const auditService = {
  list: async (params?: Record<string, string>) => {
    const res = await api.get<{ data: AuditLog[] }>("/audit", params);
    return res.data;
  },
};
