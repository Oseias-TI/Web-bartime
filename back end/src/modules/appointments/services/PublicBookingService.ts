import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { googleCalendarService } from '../../../shared/services/GoogleCalendarService';


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
            select: { id: true, name: true, logoUrl: true, businessHours: true }
        });
        if (!tenant) throw new AppError('Barbearia não encontrada', 404);
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
            return []; // Fechado
        }

        // BUG-13: Obter duração do serviço para verificar conflitos com a duração real
        let serviceDurationMin = 30; // fallback padrão
        if (serviceId) {
            const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId: tenant.id, active: true } });
            if (service) serviceDurationMin = service.durationMin;
        }

        // Gerar slots de 30 em 30 min
        const slots: string[] = [];
        const [openH, openM] = businessHour.openTime.split(':').map(Number);
        const [closeH, closeM] = businessHour.closeTime.split(':').map(Number);
        const closeMinutes = closeH * 60 + closeM;
        
        let currentH = openH;
        let currentM = openM;

        while (currentH * 60 + currentM + serviceDurationMin <= closeMinutes) {
            const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
            slots.push(timeStr);
            currentM += 30;
            if (currentM >= 60) {
                currentM -= 60;
                currentH += 1;
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

        // BUG-13: Verificar conflito com a duração completa do serviço, não apenas o horário de início
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

        // Criar ou obter cliente (busca por telefone ou email)
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
            // Se o cliente existe mas não tinha email, atualiza
            client = await prisma.client.update({
                where: { id: client.id },
                data: { email: data.clientEmail }
            });
        }

        const startDate = new Date(data.startTime);
        const endDate = new Date(startDate.getTime() + service.durationMin * 60000);

        // BUG-09: Usar transação para evitar race condition (dois clientes agendando o mesmo horário)
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

        // Add to Google Calendar asynchronously
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

        return appointment;
    }
}
