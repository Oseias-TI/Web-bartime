import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { googleCalendarService } from '../../../shared/services/GoogleCalendarService';
import { sendMail } from '../../../shared/utils/mailer';

export class PublicBookingService {
    async getAllTenants() {
        return prisma.tenant.findMany({
            select: { slug: true, name: true, logoUrl: true },
            orderBy: { name: 'asc' }
        });
    }

    async getTenantBySlug(slug: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { slug },
            select: { id: true, name: true, logoUrl: true, businessHours: true, subscriptionStatus: true }
        });
        if (!tenant) throw new AppError('Barbearia não encontrada', 404);
        if (tenant.subscriptionStatus === 'CANCELED') {
            throw new AppError('Esta barbearia não está mais ativa na plataforma.', 403);
        }
        return tenant;
    }

    async getServices(slug: string) {
        const tenant = await this.getTenantBySlug(slug);
        return prisma.service.findMany({
            where: { tenantId: tenant.id, active: true },
            select: { id: true, name: true, price: true, durationMin: true }
        });
    }

    async getProfessionals(slug: string) {
        const tenant = await this.getTenantBySlug(slug);
        return prisma.professional.findMany({
            where: { tenantId: tenant.id, active: true, role: { in: ['ADMIN', 'BARBER'] } },
            select: { id: true, name: true, avatarUrl: true }
        });
    }

    async getAvailability(slug: string, date: string, professionalId?: string, serviceId?: string) {
        const tenant = await this.getTenantBySlug(slug);
        
        const targetDate = new Date(`${date}T00:00:00.000Z`);
        const dayOfWeek = targetDate.getUTCDay();

        const businessHour = await prisma.businessHour.findFirst({
            where: { tenantId: tenant.id, dayOfWeek, open: true }
        });

        if (!businessHour || !businessHour.openTime || !businessHour.closeTime) {
            return [];
        }

        let serviceDurationMin = 30;
        if (serviceId) {
            const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId: tenant.id, active: true } });
            if (service) serviceDurationMin = service.durationMin;
        }

        const shifts = [];
        if (businessHour.openTime && businessHour.closeTime) {
            const [openH, openM] = businessHour.openTime.split(':').map(Number);
            const [closeH, closeM] = businessHour.closeTime.split(':').map(Number);
            shifts.push({ openMinutes: openH * 60 + openM, closeMinutes: closeH * 60 + closeM });
        }
        if (businessHour.openTime2 && businessHour.closeTime2) {
            const [openH, openM] = businessHour.openTime2.split(':').map(Number);
            const [closeH, closeM] = businessHour.closeTime2.split(':').map(Number);
            shifts.push({ openMinutes: openH * 60 + openM, closeMinutes: closeH * 60 + closeM });
        }

        const slots: string[] = [];
        
        for (const shift of shifts) {
            let currentMins = shift.openMinutes;
            while (currentMins + serviceDurationMin <= shift.closeMinutes) {
                const currentH = Math.floor(currentMins / 60);
                const currentM = currentMins % 60;
                const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
                slots.push(timeStr);
                currentMins += 30;
            }
        }

        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        const appointments = await prisma.appointment.findMany({
            where: {
                tenantId: tenant.id,
                status: { notIn: ['CANCELED'] },
                startTime: { gte: startOfDay, lte: endOfDay },
                ...(professionalId ? { professionalId } : {})
            }
        });

        const availableSlots = slots.filter(slot => {
            const [slotH, slotM] = slot.split(':').map(Number);
            const slotStartMs = new Date(`${date}T${slot}:00.000Z`).getTime();
            const slotEndMs = slotStartMs + serviceDurationMin * 60_000;

            return !appointments.some(app => {
                const appStart = new Date(app.startTime).getTime();
                const appEnd = new Date(app.endTime).getTime();
                return slotStartMs < appEnd && slotEndMs > appStart;
            });
        });

        return availableSlots;
    }

    async createAppointment(data: { slug: string, serviceId: string, professionalId?: string, clientName: string, clientPhone: string, clientEmail?: string | null, startTime: string }) {
        const tenant = await this.getTenantBySlug(data.slug);
        const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
        if (!service) throw new AppError('Serviço não encontrado', 404);

        let professionalId = data.professionalId;
        if (!professionalId) {
            const prof = await prisma.professional.findFirst({ where: { tenantId: tenant.id, active: true } });
            if (!prof) throw new AppError('Nenhum profissional disponível', 400);
            professionalId = prof.id;
        }

        let client = await prisma.client.findFirst({
            where: { 
                tenantId: tenant.id, 
                OR: [
                    { phone: data.clientPhone },
                    ...(data.clientEmail ? [{ email: data.clientEmail }] : [])
                ]
            }
        });

        if (!client) {
            client = await prisma.client.create({
                data: {
                    tenantId: tenant.id,
                    name: data.clientName,
                    phone: data.clientPhone,
                    email: data.clientEmail || null
                }
            });
        } else if (data.clientEmail && !client.email) {
            client = await prisma.client.update({
                where: { id: client.id },
                data: { email: data.clientEmail }
            });
        }

        const startDate = new Date(data.startTime);
        const endDate = new Date(startDate.getTime() + service.durationMin * 60000);

        const appointment = await prisma.$transaction(async (tx) => {
            const conflict = await tx.appointment.findFirst({
                where: {
                    tenantId: tenant.id,
                    professionalId,
                    status: { notIn: ['CANCELED'] },
                    OR: [
                        { startTime: { lt: endDate }, endTime: { gt: startDate } }
                    ]
                }
            });

            if (conflict) {
                throw new AppError('Este horário já não está mais disponível.', 409);
            }

            return tx.appointment.create({
                data: {
                    tenantId: tenant.id,
                    clientId: client.id,
                    professionalId,
                    serviceId: service.id,
                    startTime: startDate,
                    endTime: endDate,
                    status: 'PENDING'
                },
                include: { service: true, professional: { select: { id: true, name: true, email: true } }, client: { select: { id: true, name: true } } }
            });
        });

        googleCalendarService.createEvent({
            summary: `Agendamento Web: ${appointment.client.name} - ${appointment.service.name}`,
            description: `Cliente: ${appointment.client.name}\nEmail: ${data.clientEmail || 'N/A'}\nTelefone: ${data.clientPhone}\nServiço: ${appointment.service.name}\nProfissional: ${appointment.professional.name}`,
            startTime: startDate,
            endTime: endDate,
            professionalEmail: appointment.professional.email || undefined,
            clientEmail: data.clientEmail || undefined
        }).then(eventId => {
            if (eventId) {
                prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { googleEventId: eventId }
                }).catch(console.error);
            }
        });

        const dateStr = startDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long' });
        const timeStr = startDate.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

        if (appointment.professional.email) {
            sendMail({
                to: appointment.professional.email,
                subject: 'Bartime — Novo Agendamento Recebido!',
                html: `
                  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
                    <h2>Olá, ${appointment.professional.name}!</h2>
                    <p>Um novo agendamento foi feito pela área pública do cliente:</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                      <tr><td style="padding:8px;color:#6b7280;">Cliente</td><td style="padding:8px;font-weight:bold;">${appointment.client.name} (${data.clientPhone})</td></tr>
                      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Serviço</td><td style="padding:8px;font-weight:bold;">${appointment.service.name}</td></tr>
                      <tr><td style="padding:8px;color:#6b7280;">Data</td><td style="padding:8px;font-weight:bold;">${dateStr}</td></tr>
                      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Horário</td><td style="padding:8px;font-weight:bold;">${timeStr}</td></tr>
                    </table>
                  </div>
                `,
            }).catch(err => console.error(`[PublicBooking] Erro email barbeiro:`, err));
        }

        if (data.clientEmail) {
            sendMail({
                to: data.clientEmail,
                subject: 'Bartime — Agendamento Confirmado!',
                html: `
                  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
                    <h2>Olá, ${appointment.client.name}!</h2>
                    <p>Seu agendamento foi confirmado com sucesso na barbearia ${tenant.name}:</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                      <tr><td style="padding:8px;color:#6b7280;">Profissional</td><td style="padding:8px;font-weight:bold;">${appointment.professional.name}</td></tr>
                      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Serviço</td><td style="padding:8px;font-weight:bold;">${appointment.service.name}</td></tr>
                      <tr><td style="padding:8px;color:#6b7280;">Data</td><td style="padding:8px;font-weight:bold;">${dateStr}</td></tr>
                      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Horário</td><td style="padding:8px;font-weight:bold;">${timeStr}</td></tr>
                    </table>
                  </div>
                `,
            }).catch(err => console.error(`[PublicBooking] Erro email cliente:`, err));
        }

        return appointment;
    }
}
