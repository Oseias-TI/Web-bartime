import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { localNowAsUTC } from '../../../shared/utils/timezone';
import { googleCalendarService } from '../../../shared/services/GoogleCalendarService';

interface CancelInput {
    appointmentId: string;
    tenantId: string;
    userId: string;
    userRole: string;
    reason?: string;
}

export class CancelAppointmentService {
    async execute({ appointmentId, tenantId, userId, userRole, reason }: CancelInput) {
        const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, tenantId } });
        if (!appointment) throw new AppError('Agendamento não encontrado.', 404);
        if (appointment.status === 'COMPLETED') throw new AppError('Não é possível cancelar um agendamento já concluído.', 400);
        if (appointment.status === 'CANCELED') throw new AppError('Este agendamento já foi cancelado.', 400);
        if (userRole === 'BARBER' && appointment.professionalId !== userId) throw new AppError('Você não tem permissão para cancelar este agendamento.', 403);
        if (new Date(appointment.startTime).getTime() <= localNowAsUTC()) throw new AppError('Não é possível cancelar um agendamento que já iniciou.', 400);

        // BUG-12: Usar transação para cancelar agendamento e comissões PENDING associadas atomicamente
        const updatedAppointment = await prisma.$transaction(async (tx) => {
            // Cancela comissões PENDING vinculadas ao agendamento (evita comissões órfãs)
            await tx.commission.updateMany({
                where: { appointmentId, status: 'PENDING' },
                data: { status: 'CANCELED' },
            });

            return tx.appointment.update({
                where: { id: appointmentId },
                data: { status: 'CANCELED' },
                include: { client: { select: { name: true, phone: true } }, service: { select: { name: true } }, professional: { select: { name: true } } },
            });
        });

        if (appointment.googleEventId) {
            googleCalendarService.deleteEvent(appointment.googleEventId).catch(console.error);
        }

        return updatedAppointment;
    }
}