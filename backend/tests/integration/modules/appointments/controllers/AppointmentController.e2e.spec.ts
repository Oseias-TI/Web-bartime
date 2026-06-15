import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// ── Mock do Prisma ────────────────────────────────────────────────────────
jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        service: { findFirst: jest.fn() },
        businessHour: { findUnique: jest.fn() },
        $transaction: jest.fn(),
        appointment: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        auditLog: { create: jest.fn() },
    },
}));

// ── Mock do Redis ──────────────────────────────────────────────────────────
jest.mock('../../../../../src/lib/redis', () => ({
    redisClient: {
        del: jest.fn(),
        get: jest.fn(),
        setEx: jest.fn(),
        isReady: false,
    },
}));

// ── Mock do Logger ────────────────────────────────────────────────────────
jest.mock('../../../../../src/shared/utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        child: jest.fn().mockReturnValue({
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        }),
    },
}));

// ── Mock do Mailer ────────────────────────────────────────────────────────
jest.mock('../../../../../src/shared/utils/mailer', () => ({
    sendMail: jest.fn().mockResolvedValue(true),
}));

// ── Mock Middlewares de Auth/Subscription ─────────────────────────────────
jest.mock('../../../../../src/shared/middlewares/checkSubscription', () => ({
    checkSubscription: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../../../../src/shared/middlewares/auditLogger', () => ({
    auditLog: () => (req: any, res: any, next: any) => next(),
}));
jest.mock('../../../../../src/shared/middlewares/rateLimiter', () => ({
    globalLimiter: (req: any, res: any, next: any) => next(),
    authLimiter: (req: any, res: any, next: any) => next(),
    registerLimiter: (req: any, res: any, next: any) => next(),
    publicLimiter: (req: any, res: any, next: any) => next(),
    publicBookingLimiter: (req: any, res: any, next: any) => next(),
}));

import { app } from '../../../../../src/app';
import { prisma } from '../../../../../src/lib/prisma';

const generateToken = (tenantId: string, professionalId: string) => {
    return jwt.sign({ tenantId, role: 'ADMIN' }, process.env.JWT_SECRET || 'secret', {
        subject: professionalId,
        expiresIn: '1h',
    });
};

describe('AppointmentController (Integration)', () => {
    let token: string;
    const tenantId = 'tenant-123';

    beforeAll(() => {
        token = generateToken(tenantId, 'prof-123');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve retornar 201 Created quando o agendamento for criado', async () => {
        // Arrange
        const data = {
            clientId: uuidv4(),
            professionalId: uuidv4(),
            serviceId: uuidv4(),
            startTime: new Date('2030-06-05T14:00:00.000Z').toISOString(),
        };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: data.serviceId, durationMin: 30 });
        (prisma.businessHour.findUnique as jest.Mock).mockResolvedValue({ open: true, openTime: '08:00', closeTime: '18:00' });
        
        const createdAppt = { 
            id: uuidv4(), 
            tenantId, 
            ...data,
            professional: { name: 'Prof Test', email: 'prof@test.com' },
            client: { name: 'Client Test' },
            service: { name: 'Corte' }
        };

        (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prisma));
        (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.appointment.create as jest.Mock).mockResolvedValue(createdAppt);

        // Act
        const response = await request(app)
            .post('/appointments')
            .set('Authorization', `Bearer ${token}`)
            .send(data);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.clientId).toBe(data.clientId);
    });

    it('deve retornar 409 Conflict se houver choque de horario', async () => {
        // Arrange
        const data = {
            clientId: uuidv4(),
            professionalId: uuidv4(),
            serviceId: uuidv4(),
            startTime: new Date('2030-06-05T14:00:00.000Z').toISOString(),
        };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: data.serviceId, durationMin: 30 });
        (prisma.businessHour.findUnique as jest.Mock).mockResolvedValue({ open: true, openTime: '08:00', closeTime: '18:00' });
        
        (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prisma));
        (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({ id: 'conflict-id' }); // Conflito simulado

        // Act
        const response = await request(app)
            .post('/appointments')
            .set('Authorization', `Bearer ${token}`)
            .send(data);

        // Assert
        expect(response.status).toBe(409);
        expect(response.body.message).toMatch(/já possui agendamento/i);
    });
});
