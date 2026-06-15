import { AppError } from '../../../shared/errors/AppError';
import { IAppointmentRepository } from '../repositories/IAppointmentRepository';
import { PrismaAppointmentRepository } from '../repositories/implementations/PrismaAppointmentRepository';

interface CompleteInput {
    appointmentId: string;
    tenantId: string;
    paymentMethod: string;
}

export class CompleteAppointmentService {
    constructor(
        private appointmentRepository: IAppointmentRepository = new PrismaAppointmentRepository()
    ) {}

    async execute({ appointmentId, tenantId, paymentMethod }: CompleteInput) {
        const appointment = await this.appointmentRepository.findById(appointmentId, tenantId);
        
        if (!appointment || appointment.status !== 'PENDING') {
            throw new AppError('Agendamento não encontrado ou já processado.', 404);
        }

        const servicePrice = Number(appointment.service.price || 0);
        const commissionAmount = servicePrice * (Number(appointment.professional.commissionRate || 0) / 100);

        return this.appointmentRepository.completeAppointmentAndCreateFinancials(
            appointmentId,
            paymentMethod,
            servicePrice,
            commissionAmount,
            appointment.tenantId,
            appointment.professionalId,
            appointment.clientId,
            appointment.service.name,
            appointment.professional.name
        );
    }
}