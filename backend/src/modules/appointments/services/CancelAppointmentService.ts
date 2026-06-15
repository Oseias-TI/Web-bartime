import { AppError } from '../../../shared/errors/AppError';
import { localNowAsUTC } from '../../../shared/utils/timezone';
import { googleCalendarService } from '../../../shared/services/GoogleCalendarService';
import { IAppointmentRepository } from '../repositories/IAppointmentRepository';
import { PrismaAppointmentRepository } from '../repositories/implementations/PrismaAppointmentRepository';

interface CancelInput {
    appointmentId: string;
    tenantId: string;
    userId: string;
    userRole: string;
    reason?: string;
}

export class CancelAppointmentService {
    constructor(
        private appointmentRepository: IAppointmentRepository = new PrismaAppointmentRepository()
    ) {}

    async execute({ appointmentId, tenantId, userId, userRole, reason }: CancelInput) {
        const appointment = await this.appointmentRepository.findById(appointmentId, tenantId);
        
        if (!appointment) throw new AppError('Agendamento não encontrado.', 404);
        if (appointment.status === 'COMPLETED') throw new AppError('Não é possível cancelar um agendamento já concluído.', 400);
        if (appointment.status === 'CANCELED') throw new AppError('Este agendamento já foi cancelado.', 400);
        if (userRole === 'BARBER' && appointment.professionalId !== userId) throw new AppError('Você não tem permissão para cancelar este agendamento.', 403);
        if (new Date(appointment.startTime).getTime() <= localNowAsUTC()) throw new AppError('Não é possível cancelar um agendamento que já iniciou.', 400);

        // BUG-12: Usar transação para cancelar agendamento e comissões PENDING associadas atomicamente
        const updatedAppointment = await this.appointmentRepository.cancelAppointmentWithCommissions(appointmentId);

        if (appointment.googleEventId) {
            googleCalendarService.deleteEvent(appointment.googleEventId).catch(console.error);
        }

        return updatedAppointment;
    }
}