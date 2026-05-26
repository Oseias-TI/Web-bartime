import { api } from "@/lib/api";

export interface Report {
  totalAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
  totalRevenue: number;
  averageTicket: number;
  topServices: Array<{ name: string; count: number; revenue: number }>;
  topProfessionals: Array<{ name: string; count: number; revenue: number }>;
}

export const reportsService = {
  generate: (params?: Record<string, string>) =>
    api.get<Report>("/reports", params),

  generateByProfessional: (id: string, params?: Record<string, string>) =>
    api.get<Report>(`/reports/professional/${id}`, params),

  exportExcel: (params?: Record<string, string>) =>
    api.download("/reports/export/excel", params),

  exportPdf: (params?: Record<string, string>) =>
    api.download("/reports/export/pdf", params),
};
