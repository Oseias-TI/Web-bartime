import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';


export class PublicBookingService {
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

    async getAvailability(slug: string, date: string, professionalId?: string) {
        const tenant = await this.getTenantBySlug(slug);
        // Utilizando a lógica básica de slots já existente ou uma versão simplificada
        // Para fins de agendamento público, vamos simplificar para não depender do Authentication
        
        const targetDate = new Date(`${date}T00:00:00.000Z`);
        const dayOfWeek = targetDate.getUTCDay();

        const businessHour = await prisma.businessHour.findFirst({
            where: { tenantId: tenant.id, dayOfWeek, open: true }
        });

        if (!businessHour || !businessHour.openTime || !businessHour.closeTime) {
            return []; // Fechado
        }

        // Buscar profissionais disponíveis (se não especificado, busca de todos ativos)
        const profs = professionalId 
            ? [{ id: professionalId }] 
            : await prisma.professional.findMany({ where: { tenantId: tenant.id, active: true } });

        // Gerar slots de 30 em 30 min (exemplo simplificado)
        const slots: string[] = [];
        const [openH, openM] = businessHour.openTime.split(':').map(Number);
        const [closeH, closeM] = businessHour.closeTime.split(':').map(Number);
        
        let currentH = openH;
        let currentM = openM;

        while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
            const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
            slots.push(timeStr);
            currentM += 30;
            if (currentM >= 60) {
                currentM -= 60;
                currentH += 1;
            }
        }

        // Filtrar horários ocupados (simplificado: não verifica a duração inteira, apenas o slot de início)
        // O ideal é reusar o AvailabilityService, mas sem req.user
        
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const appointments = await prisma.appointment.findMany({
            where: {
                tenantId: tenant.id,
                status: { notIn: ['CANCELED'] },
                startTime: { gte: startOfDay, lte: endOfDay },
                ...(professionalId ? { professionalId } : {})
            }
        });

        const occupiedTimes = appointments.map(app => {
            const date = new Date(app.startTime);
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        });

        const availableSlots = slots.filter(slot => !occupiedTimes.includes(slot));

        return availableSlots;
    }

    async createAppointment(data: { slug: string, serviceId: string, professionalId?: string, clientName: string, clientPhone: string, startTime: string }) {
        const tenant = await this.getTenantBySlug(data.slug);
        const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
        if (!service) throw new AppError('Serviço não encontrado', 404);

        let professionalId = data.professionalId;
        if (!professionalId) {
            const prof = await prisma.professional.findFirst({ where: { tenantId: tenant.id, active: true } });
            if (!prof) throw new AppError('Nenhum profissional disponível', 400);
            professionalId = prof.id;
        }

        // Criar ou obter cliente
        let client = await prisma.client.findFirst({
            where: { tenantId: tenant.id, phone: data.clientPhone }
        });

        if (!client) {
            client = await prisma.client.create({
                data: {
                    tenantId: tenant.id,
                    name: data.clientName,
                    phone: data.clientPhone
                }
            });
        }

        const startDate = new Date(data.startTime);
        const endDate = new Date(startDate.getTime() + service.durationMin * 60000);

        // Validar choque de horário
        const conflict = await prisma.appointment.findFirst({
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

        const appointment = await prisma.appointment.create({
            data: {
                tenantId: tenant.id,
                clientId: client.id,
                professionalId,
                serviceId: service.id,
                startTime: startDate,
                endTime: endDate,
                status: 'PENDING'
            }
        });

        return appointment;
    }
}
