import request from 'supertest';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        professional: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
        appointment: {
            updateMany: jest.fn(),
        },
        auditLog: { create: jest.fn() },
    },
}));

jest.mock('../../../../../src/lib/redis', () => ({
    redisClient: {
        del: jest.fn(),
        get: jest.fn(),
        setEx: jest.fn(),
        isReady: false,
    },
}));

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
    publicBookingLimiter: (req: any, res: any, next: any) => next(),
}));

import { app } from '../../../../../src/app';
import { prisma } from '../../../../../src/lib/prisma';

const generateToken = (tenantId: string, professionalId: string, role: string) => {
    return jwt.sign({ tenantId, role }, process.env.JWT_SECRET || 'secret', {
        subject: professionalId,
        expiresIn: '1h',
    });
};

describe('ProfessionalController (Integration)', () => {
    let adminToken: string;
    const tenantId = 'tenant-123';
    const adminId = 'prof-admin';

    beforeAll(() => {
        adminToken = generateToken(tenantId, adminId, 'ADMIN');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

it('deve retornar 200 OK com lista paginada de profissionais', async () => {
        const professionals = [
            { id: uuidv4(), name: 'João', email: 'joao@test.com', role: 'BARBER', commissionRate: 40, avatarUrl: null, active: true, _count: { appointments: 5 } },
            { id: uuidv4(), name: 'Maria', email: 'maria@test.com', role: 'ADMIN', commissionRate: 50, avatarUrl: null, active: true, _count: { appointments: 10 } },
        ];

        (prisma.professional.findMany as jest.Mock).mockResolvedValue(professionals);
        (prisma.professional.count as jest.Mock).mockResolvedValue(2);

        const response = await request(app)
            .get('/professionals')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveLength(2);
    });

it('deve retornar 200 OK ao buscar profissional por ID', async () => {
        const profId = uuidv4();
        const professional = {
            id: profId,
            name: 'João Barbeiro',
            email: 'joao@test.com',
            role: 'BARBER',
            commissionRate: 40,
            avatarUrl: null,
        };

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(professional);

        const response = await request(app)
            .get(`/professionals/${profId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name', 'João Barbeiro');
    });

    it('deve retornar 404 Not Found quando profissional nao existir', async () => {
        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .get(`/professionals/${uuidv4()}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/não encontrado/i);
    });

it('deve retornar 200 OK ao atualizar profissional', async () => {
        const profId = uuidv4();
        const existing = { id: profId, tenantId, name: 'João', role: 'BARBER', active: true };
        const updated = { id: profId, name: 'João Silva', email: 'joao@test.com', role: 'BARBER', commissionRate: 45, avatarUrl: null };

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.professional.update as jest.Mock).mockResolvedValue(updated);

        const response = await request(app)
            .patch(`/professionals/${profId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'João Silva', commissionRate: 45 });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('João Silva');
    });

it('deve retornar 200 OK ao desativar profissional', async () => {
        const profId = uuidv4();
        const existing = { id: profId, tenantId, name: 'Carlos', role: 'BARBER', active: true };
        const deactivated = { id: profId, name: 'Carlos', active: false };

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.appointment.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
        (prisma.professional.update as jest.Mock).mockResolvedValue(deactivated);

        const response = await request(app)
            .delete(`/professionals/${profId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toMatch(/desativado/i);
    });

    it('deve retornar 400 ao tentar desativar a si mesmo', async () => {
        const existing = { id: adminId, tenantId, name: 'Admin', role: 'ADMIN', active: true };

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(existing);

        const response = await request(app)
            .delete(`/professionals/${adminId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/própria conta/i);
    });
});
