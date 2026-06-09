import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

interface CompleteInput {
    appointmentId: string;
    tenantId: string;
    paymentMethod: string;
}

export class CompleteAppointmentService {
    async execute({ appointmentId, tenantId, paymentMethod }: CompleteInput) {
        const appointment = await prisma.appointment.findFirst({
            where: { id: appointmentId, tenantId, status: 'PENDING' },
            include: { service: true, professional: true },
        });
        if (!appointment) throw new AppError('Agendamento não encontrado ou já processado.', 404);

        const servicePrice = Number(appointment.service.price);
        const commissionAmount = servicePrice * (Number(appointment.professional.commissionRate) / 100);

        return prisma.$transaction(async tx => {
            const updated = await tx.appointment.update({ where: { id: appointmentId }, data: { status: 'COMPLETED', paymentMethod } });
            // BUG-08: Usar appointment.tenantId para garantir consistência cross-tenant
            const commission = await tx.commission.create({
                data: { tenantId: appointment.tenantId, appointmentId, professionalId: appointment.professionalId, amount: commissionAmount, status: 'PENDING' },
            });
            // BUG-15: Usar nome do serviço como categoria ao invés de 'HAIRCUT' fixo
            await tx.transaction.create({
                data: { tenantId: appointment.tenantId, appointmentId, type: 'INCOME', category: appointment.service.name, paymentMethod, amount: servicePrice, description: `${appointment.service.name} — ${appointment.professional.name}` },
            });
            await tx.client.update({ where: { id: appointment.clientId }, data: { loyaltyPoints: { increment: 1 } } });
            return { appointment: updated, commission, revenue: servicePrice };
        });
    }
}