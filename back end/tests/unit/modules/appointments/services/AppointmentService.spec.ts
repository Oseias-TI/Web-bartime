import { AppointmentService } from '../../../../../src/modules/appointments/services/AppointmentService';
import { prisma } from '../../../../../src/lib/prisma';
import { AppError } from '../../../../../src/shared/errors/AppError';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        service: { findFirst: jest.fn() },
        businessHour: { findUnique: jest.fn() },
        $transaction: jest.fn(),
        appointment: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        }
    },
}));

jest.mock('../../../../../src/shared/utils/mailer', () => ({
    sendMail: jest.fn().mockResolvedValue(true),
}));

describe('AppointmentService (Unit)', () => {
    let appointmentService: AppointmentService;

    beforeEach(() => {
        appointmentService = new AppointmentService();
        jest.clearAllMocks();
    });

    it('deve criar um agendamento com sucesso', async () => {
        // Arrange
        const data = {
            tenantId: 'tenant-1',
            clientId: 'client-1',
            professionalId: 'prof-1',
            serviceId: 'serv-1',
            startTime: new Date('2026-06-05T14:00:00.000Z').toISOString() // Sexta, 14:00 UTC (dependendo do fuso pode cair em outro)
        };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: 'serv-1', durationMin: 30 });
        (prisma.businessHour.findUnique as jest.Mock).mockResolvedValue({ open: true, openTime: '08:00', closeTime: '18:00' });
        
        const createdAppt = {
            id: 'appt-1',
            professional: { id: 'prof-1', email: 'prof@teste.com' },
            client: { name: 'João' },
            service: { name: 'Corte' },
        };

        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
            return callback(prisma);
        });

        (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null); // Sem conflito
        (prisma.appointment.create as jest.Mock).mockResolvedValue(createdAppt);

        // Act
        const result = await appointmentService.createAppointment(data);

        // Assert
        expect(prisma.service.findFirst).toHaveBeenCalled();
        expect(prisma.businessHour.findUnique).toHaveBeenCalled();
        expect(prisma.$transaction).toHaveBeenCalled();
        expect(prisma.appointment.findFirst).toHaveBeenCalled();
        expect(prisma.appointment.create).toHaveBeenCalled();
        expect(result).toEqual(createdAppt);
    });

    it('deve lancar AppError se a barbearia estiver fechada (fora de horario)', async () => {
        // Arrange
        const data = {
            tenantId: 'tenant-1',
            clientId: 'client-1',
            professionalId: 'prof-1',
            serviceId: 'serv-1',
            startTime: new Date('2026-06-05T03:00:00.000Z').toISOString() // 00:00 no Brasil (madrugada), com certeza fora das 08:00 - 18:00
        };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: 'serv-1', durationMin: 30 });
        (prisma.businessHour.findUnique as jest.Mock).mockResolvedValue({ open: true, openTime: '08:00', closeTime: '18:00' });

        // Act & Assert
        await expect(appointmentService.createAppointment(data))
            .rejects.toBeInstanceOf(AppError);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deve lancar AppError se houver conflito de horario', async () => {
        // Arrange
        const data = {
            tenantId: 'tenant-1',
            clientId: 'client-1',
            professionalId: 'prof-1',
            serviceId: 'serv-1',
            startTime: new Date('2026-06-05T14:00:00.000Z').toISOString()
        };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: 'serv-1', durationMin: 30 });
        (prisma.businessHour.findUnique as jest.Mock).mockResolvedValue({ open: true, openTime: '08:00', closeTime: '18:00' });

        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
            return callback(prisma);
        });

        // Simula conflito existente
        (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-appt' });

        // Act & Assert
        await expect(appointmentService.createAppointment(data))
            .rejects.toBeInstanceOf(AppError);
        expect(prisma.appointment.create).not.toHaveBeenCalled();
    });
});
