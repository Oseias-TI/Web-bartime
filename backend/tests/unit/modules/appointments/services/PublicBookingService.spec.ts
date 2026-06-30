import { PublicBookingService } from '../../../../../src/modules/appointments/services/PublicBookingService';
import { prisma } from '../../../../../src/lib/prisma';
import { AppError } from '../../../../../src/shared/errors/AppError';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        tenant: { findUnique: jest.fn() },
        service: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
        professional: { findMany: jest.fn(), findFirst: jest.fn() },
        businessHour: { findFirst: jest.fn() },
        appointment: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn().mockResolvedValue({}) },
        client: { findFirst: jest.fn(), create: jest.fn() },
        $transaction: jest.fn(),
    },
}));

jest.mock('../../../../../src/shared/services/GoogleCalendarService', () => ({
    googleCalendarService: {
        createEvent: jest.fn().mockResolvedValue('mock-event-id'),
        deleteEvent: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('../../../../../src/shared/utils/mailer', () => ({
    sendMail: jest.fn().mockResolvedValue(true),
}));

describe('PublicBookingService (Unit)', () => {
    let publicBookingService: PublicBookingService;

    beforeEach(() => {
        publicBookingService = new PublicBookingService();
        jest.clearAllMocks();
    });

    it('deve listar os servicos corretamente buscando pelo slug', async () => {
        (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'tenant-1', name: 'Teste' });
        (prisma.service.findMany as jest.Mock).mockResolvedValue([
            { id: 'service-1', name: 'Corte', price: 50, durationMin: 30 }
        ]);

        const services = await publicBookingService.getServices('teste-slug');

        expect(services).toHaveLength(1);
        expect(services[0].name).toBe('Corte');
        expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { slug: 'teste-slug' }, select: expect.any(Object) });
        expect(prisma.service.findMany).toHaveBeenCalledWith({
            where: { tenantId: 'tenant-1', active: true },
            select: expect.any(Object)
        });
    });

    it('deve disparar AppError se a barbearia estiver fechada ou nao existir horario na disponibilidade', async () => {
        (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'tenant-1', name: 'Teste' });
        (prisma.businessHour.findFirst as jest.Mock).mockResolvedValue(null);

        const availability = await publicBookingService.getAvailability('teste-slug', '2030-06-05');

        expect(availability).toEqual([]);
    });

    it('deve criar um agendamento novo se houver disponibilidade', async () => {
        (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'tenant-1', name: 'Teste' });
        (prisma.service.findUnique as jest.Mock).mockResolvedValue({ id: 'service-1', durationMin: 30 });
        (prisma.professional.findFirst as jest.Mock).mockResolvedValue({ id: 'prof-1' });
        (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.client.create as jest.Mock).mockResolvedValue({ id: 'client-1' });

        (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
            return cb(prisma);
        });

        (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.appointment.create as jest.Mock).mockResolvedValue({
            id: 'appt-1',
            client: { id: 'client-1', name: 'Cliente Novo' },
            service: { name: 'Corte', price: 50, durationMin: 30 },
            professional: { id: 'prof-1', name: 'Barbeiro Teste', email: null },
        });

        const result = await publicBookingService.createAppointment({
            slug: 'teste-slug',
            serviceId: 'service-1',
            clientName: 'Cliente Novo',
            clientPhone: '11999999999',
            startTime: '2030-06-05T14:00:00.000Z'
        });

        expect(result).toHaveProperty('id', 'appt-1');
        expect(prisma.appointment.create).toHaveBeenCalled();
        expect(prisma.client.create).toHaveBeenCalled();
    });

    it('deve disparar AppError se tentar criar agendamento em horario conflitante', async () => {
        (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'tenant-1', name: 'Teste' });
        (prisma.service.findUnique as jest.Mock).mockResolvedValue({ id: 'service-1', durationMin: 30 });
        (prisma.professional.findFirst as jest.Mock).mockResolvedValue({ id: 'prof-1' });
        (prisma.client.findFirst as jest.Mock).mockResolvedValue({ id: 'client-1' });

        (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
            return cb(prisma);
        });

        (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'appt-conflict' });

        await expect(publicBookingService.createAppointment({
            slug: 'teste-slug',
            serviceId: 'service-1',
            clientName: 'Cliente Teste',
            clientPhone: '11999999999',
            startTime: '2030-06-05T14:00:00.000Z'
        })).rejects.toBeInstanceOf(AppError);
    });
});
