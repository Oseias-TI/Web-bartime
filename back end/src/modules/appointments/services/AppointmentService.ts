import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { CreateAppointmentInput } from '../dtos/CreateAppointmentSchema';
import { getPaginationParams, buildPaginatedResult } from '../../../shared/utils/paginate';
import { sendMail } from '../../../shared/utils/mailer';
import { googleCalendarService } from '../../../shared/services/GoogleCalendarService';

interface CreateAppointmentData extends CreateAppointmentInput {
    tenantId: string;
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

export class AppointmentService {
    async createAppointment(data: CreateAppointmentData) {
        const startTime = new Date(data.startTime);

        const [service, businessHour] = await Promise.all([
            prisma.service.findFirst({ where: { id: data.serviceId, tenantId: data.tenantId, active: true } }),
            prisma.businessHour.findUnique({ where: { tenantId_dayOfWeek: { tenantId: data.tenantId, dayOfWeek: startTime.getUTCDay() } } }),
        ]);

        if (!service) throw new AppError('Serviço não encontrado ou inativo.', 404);
        if (!businessHour || !businessHour.open || !businessHour.openTime || !businessHour.closeTime)
            throw new AppError('A barbearia não funciona neste dia.', 400);

        const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
        const openMinutes = timeToMinutes(businessHour.openTime);
        const closeMinutes = timeToMinutes(businessHour.closeTime);
        const endMinutes = startMinutes + service.durationMin;

        if (startMinutes < openMinutes || endMinutes > closeMinutes)
            throw new AppError(`Agendamento fora do horário de funcionamento (${businessHour.openTime}–${businessHour.closeTime}).`, 400);

        const endTime = new Date(startTime.getTime() + service.durationMin * 60_000);

        // BUG-02: Envolver verificação de conflito e criação em transação para evitar race condition
        const appointment = await prisma.$transaction(async (tx) => {
            const conflict = await tx.appointment.findFirst({
                where: {
                    tenantId: data.tenantId,
                    professionalId: data.professionalId,
                    status: { not: 'CANCELED' },
                    startTime: { lt: endTime },
                    endTime: { gt: startTime },
                },
            });
            if (conflict) throw new AppError('Profissional já possui agendamento neste horário.', 409);

            return tx.appointment.create({
                data: { tenantId: data.tenantId, clientId: data.clientId, professionalId: data.professionalId, serviceId: data.serviceId, startTime, endTime },
                include: { service: true, professional: { select: { id: true, name: true, email: true } }, client: { select: { id: true, name: true } } },
            });
        });

        // Add to Google Calendar asynchronously
        googleCalendarService.createEvent({
            summary: `Agendamento: ${appointment.client.name} - ${appointment.service.name}`,
            description: `Cliente: ${appointment.client.name}\nServiço: ${appointment.service.name}\nProfissional: ${appointment.professional.name}`,
            startTime: startTime,
            endTime: endTime,
            professionalEmail: appointment.professional.email || undefined
        }).then(eventId => {
            if (eventId) {
                prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { googleEventId: eventId }
                }).catch(console.error);
            }
        });

        if (appointment.professional.email) {
            const dateStr = startTime.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long', day: '2-digit', month: 'long' });
            const timeStr = startTime.toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });

            sendMail({
                to: appointment.professional.email,
                subject: 'Bartime — Novo Agendamento Recebido!',
                html: `
                  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
                    <h2>Olá, ${appointment.professional.name}!</h2>
                    <p>Você tem um novo agendamento marcado:</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                      <tr><td style="padding:8px;color:#6b7280;">Cliente</td><td style="padding:8px;font-weight:bold;">${appointment.client.name}</td></tr>
                      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Serviço</td><td style="padding:8px;font-weight:bold;">${appointment.service.name}</td></tr>
                      <tr><td style="padding:8px;color:#6b7280;">Data</td><td style="padding:8px;font-weight:bold;">${dateStr}</td></tr>
                      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Horário</td><td style="padding:8px;font-weight:bold;">${timeStr}</td></tr>
                    </table>
                    <p style="color:#6b7280;font-size:13px;">Bom trabalho!</p>
                  </div>
                `,
            }).catch(err => {
                console.error(`[Appointment] Erro ao enviar e-mail para o barbeiro ${appointment.professional.email}:`, err);
            });
        }

        return appointment;
    }

    async listByDay(tenantId: string, date: string, professionalId?: string, paginationQuery: Record<string, any> = {}) {
        const params = getPaginationParams(paginationQuery);
        // Usar Z para consistência com a convenção local-as-UTC do sistema
        const start = new Date(`${date}T00:00:00.000Z`);
        const end = new Date(`${date}T23:59:59.999Z`);
        
        const where: any = { tenantId, startTime: { gte: start, lte: end } };
        if (professionalId) {
            where.professionalId = professionalId;
        }

        const [data, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                include: { client: { select: { name: true, phone: true } }, service: true, professional: { select: { name: true, id: true } } },
                orderBy: { startTime: 'asc' },
                skip: params.skip,
                take: params.limit,
            }),
            prisma.appointment.count({ where }),
        ]);

        return buildPaginatedResult(data, total, params);
    }
}