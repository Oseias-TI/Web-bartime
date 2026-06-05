import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { localNowAsUTC, localDateString } from '../../../shared/utils/timezone';

interface AvailabilityInput {
    tenantId: string;
    professionalId: string;
    serviceId: string;
    date: string;
}

interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
}

function toDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00.000Z`);
}

function toTimeString(date: Date): string {
    return date.toISOString().slice(11, 16);
}

const SLOT_INTERVAL_MIN = 15;

export class AvailabilityService {
    async getSlots({ tenantId, professionalId, serviceId, date }: AvailabilityInput): Promise<TimeSlot[]> {
        // Comparar com data local do servidor (não UTC) para evitar bloquear consultas à noite
        if (date < localDateString()) throw new AppError('Não é possível consultar datas passadas.', 400);

        const requestedDate = new Date(`${date}T00:00:00.000Z`);
        const dayOfWeek = requestedDate.getUTCDay();

        const [businessHour, service, existingAppointments] = await Promise.all([
            prisma.businessHour.findUnique({ where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } } }),
            prisma.service.findFirst({ where: { id: serviceId, tenantId, active: true } }),
            prisma.appointment.findMany({
                where: { tenantId, professionalId, status: { not: 'CANCELED' }, startTime: { gte: new Date(`${date}T00:00:00.000Z`), lte: new Date(`${date}T23:59:59.999Z`) } },
                select: { startTime: true, endTime: true },
                orderBy: { startTime: 'asc' },
            }),
        ]);

        if (!service) throw new AppError('Serviço não encontrado.', 404);
        if (!businessHour || !businessHour.open || !businessHour.openTime || !businessHour.closeTime) return [];

        const slots: TimeSlot[] = [];
        const openTime = toDateTime(date, businessHour.openTime);
        const closeTime = toDateTime(date, businessHour.closeTime);
        const serviceDurationMs = service.durationMin * 60_000;
        const slotIntervalMs = SLOT_INTERVAL_MIN * 60_000;
        let cursor = openTime.getTime();

        // Usar o "agora" na mesma convenção local-as-UTC para marcar slots passados
        const nowLocalAsUTC = localNowAsUTC();

        while (cursor + serviceDurationMs <= closeTime.getTime()) {
            const slotStart = new Date(cursor);
            const slotEnd = new Date(cursor + serviceDurationMs);
            const hasConflict = existingAppointments.some(appt => {
                const apptStart = new Date(appt.startTime).getTime();
                const apptEnd = new Date(appt.endTime).getTime();
                return slotStart.getTime() < apptEnd && slotEnd.getTime() > apptStart;
            });
            slots.push({ startTime: toTimeString(slotStart), endTime: toTimeString(slotEnd), available: !hasConflict && slotStart.getTime() > nowLocalAsUTC });
            cursor += slotIntervalMs;
        }

        return slots;
    }
}