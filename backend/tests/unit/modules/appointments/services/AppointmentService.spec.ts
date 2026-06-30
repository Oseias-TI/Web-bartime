import { AppointmentService } from '../../../../../src/modules/appointments/services/AppointmentService';
import { prisma } from '../../../../../src/lib/prisma';
import { AppError } from '../../../../../src/shared/errors/AppError';
import { IAppointmentRepository } from '../../../../../src/modules/appointments/repositories/IAppointmentRepository';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        service: { findFirst: jest.fn() },
        businessHour: { findUnique: jest.fn() },
    },
}));

jest.mock('../../../../../src/shared/utils/mailer', () => ({
    sendMail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../../../../src/shared/services/GoogleCalendarService', () => ({
    googleCalendarService: {
        createEvent: jest.fn().mockResolvedValue(null),
    },
}));

describe('AppointmentService (Unit)', () => {
    let appointmentService: AppointmentService;
    let appointmentRepository: jest.Mocked<IAppointmentRepository>;

    beforeEach(() => {
        appointmentRepository = {
            create: jest.fn(),
            findConflictingAppointment: jest.fn(),
            findById: jest.fn(),
            updateGoogleEventId: jest.fn(),
            listByDay: jest.fn(),
            countByDay: jest.fn(),
            cancelAppointmentWithCommissions: jest.fn(),
            completeAppointmentAndCreateFinancials: jest.fn(),
        };

        appointmentService = new AppointmentService(appointmentRepository);
        jest.clearAllMocks();
    });

    it('deve criar um agendamento com sucesso', async () => {
        const data = {
            tenantId: 'tenant-1',
            clientId: 'client-1',
            professionalId: 'prof-1',
            serviceId: 'serv-1',
            startTime: new Date('2026-06-05T14:00:00.000Z').toISOString(),
        };

        const expectedStart = new Date(data.startTime);
        const expectedEnd = new Date('2026-06-05T14:30:00.000Z');

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: 'serv-1', durationMin: 30 });
        (prisma.businessHour.findUnique as jest.Mock).mockResolvedValue({ open: true, openTime: '08:00', closeTime: '18:00' });

        const createdAppt = {
            id: 'appt-1',
            tenantId: data.tenantId,
            clientId: data.clientId,
            professionalId: data.professionalId,
            serviceId: data.serviceId,
            status: 'PENDING',
            startTime: expectedStart,
            endTime: expectedEnd,
            professional: { id: 'prof-1', name: 'Profissional', email: 'prof@teste.com' },
            client: { id: 'client-1', name: 'Joao' },
            service: { id: 'serv-1', name: 'Corte', durationMin: 30 },
        };

        appointmentRepository.findConflictingAppointment.mockResolvedValue(false);
        appointmentRepository.create.mockResolvedValue(createdAppt);

        const result = await appointmentService.createAppointment(data);

        expect(prisma.service.findFirst).toHaveBeenCalledWith({
            where: { id: data.serviceId, tenantId: data.tenantId, active: true },
        });
        expect(prisma.businessHour.findUnique).toHaveBeenCalledWith({
            where: { tenantId_dayOfWeek: { tenantId: data.tenantId, dayOfWeek: expectedStart.getUTCDay() } },
        });
        expect(appointmentRepository.findConflictingAppointment).toHaveBeenCalledWith(
            data.tenantId,
            data.professionalId,
            expectedStart,
            expectedEnd
        );
        expect(appointmentRepository.create).toHaveBeenCalledWith({
            tenantId: data.tenantId,
            clientId: data.clientId,
            professionalId: data.professionalId,
            serviceId: data.serviceId,
            startTime: expectedStart,
            endTime: expectedEnd,
        });
        expect(result).toEqual(createdAppt);
    });

    it('deve lancar AppError se a barbearia estiver fechada fora de horario', async () => {
        const data = {
            tenantId: 'tenant-1',
            clientId: 'client-1',
            professionalId: 'prof-1',
            serviceId: 'serv-1',
            startTime: new Date('2026-06-05T03:00:00.000Z').toISOString(),
        };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: 'serv-1', durationMin: 30 });
        (prisma.businessHour.findUnique as jest.Mock).mockResolvedValue({ open: true, openTime: '08:00', closeTime: '18:00' });

        await expect(appointmentService.createAppointment(data)).rejects.toBeInstanceOf(AppError);
        expect(appointmentRepository.findConflictingAppointment).not.toHaveBeenCalled();
        expect(appointmentRepository.create).not.toHaveBeenCalled();
    });

    it('deve lancar AppError se houver conflito de horario', async () => {
        const data = {
            tenantId: 'tenant-1',
            clientId: 'client-1',
            professionalId: 'prof-1',
            serviceId: 'serv-1',
            startTime: new Date('2026-06-05T14:00:00.000Z').toISOString(),
        };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: 'serv-1', durationMin: 30 });
        (prisma.businessHour.findUnique as jest.Mock).mockResolvedValue({ open: true, openTime: '08:00', closeTime: '18:00' });
        appointmentRepository.findConflictingAppointment.mockResolvedValue(true);

        await expect(appointmentService.createAppointment(data)).rejects.toBeInstanceOf(AppError);
        expect(appointmentRepository.create).not.toHaveBeenCalled();
    });
});
