import { api } from "@/lib/api";

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "COMPLETED" | "CANCELED";
  paymentMethod: string | null;
  client: { id: string; name: string; phone: string };
  professional: { id: string; name: string; avatarUrl: string | null };
  service: { id: string; name: string; price: number; durationMin: number };
}

export interface CreateAppointmentData {
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: string;
  paymentMethod?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export const appointmentsService = {
  listByDay: async (date: string, professionalId?: string) => {
    const res = await api.get<{ data: Appointment[] }>("/appointments", {
      date,
      ...(professionalId ? { professionalId } : {}),
    });
    return res.data;
  },

  create: (data: CreateAppointmentData) =>
    api.post<Appointment>("/appointments", data),

  complete: (id: string, paymentMethod?: string) =>
    api.patch<Appointment>(`/appointments/${id}/complete`, { paymentMethod }),

  cancel: (id: string) =>
    api.patch<Appointment>(`/appointments/${id}/cancel`),

  getAvailability: async (date: string, professionalId: string, serviceId: string) => {
    const res = await api.get<{ slots: TimeSlot[] }>("/appointments/availability", {
      date,
      professionalId,
      serviceId,
    });
    return res.slots;
  },
};
