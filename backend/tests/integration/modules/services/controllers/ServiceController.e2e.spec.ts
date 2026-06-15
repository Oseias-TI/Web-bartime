import request from 'supertest';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// ── Mock do Prisma ────────────────────────────────────────────────────────
jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        service: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
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

// ── Mock Middlewares ──────────────────────────────────────────────────────
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

describe('ServiceController (Integration)', () => {
    let adminToken: string;
    let barberToken: string;
    const tenantId = 'tenant-123';

    beforeAll(() => {
        adminToken = generateToken(tenantId, 'prof-admin', 'ADMIN');
        barberToken = generateToken(tenantId, 'prof-barber', 'BARBER');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── POST /services ──────────────────────────────────────────────────────

    it('deve retornar 201 Created ao criar servico com dados validos', async () => {
        const serviceData = { name: 'Corte Degradê', price: 45.0, durationMin: 30 };
        const created = { id: uuidv4(), tenantId, ...serviceData, active: true };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.service.create as jest.Mock).mockResolvedValue(created);

        const response = await request(app)
            .post('/services')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(serviceData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(serviceData.name);
        expect(response.body.price).toBe(serviceData.price);
    });

    it('deve retornar 400 Bad Request com dados invalidos (preco negativo)', async () => {
        const invalidData = { name: 'Corte', price: -10, durationMin: 30 };

        const response = await request(app)
            .post('/services')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidData);

        expect(response.status).toBe(400);
    });

    it('deve retornar 400 Bad Request com dados invalidos (nome muito curto)', async () => {
        const invalidData = { name: 'C', price: 30, durationMin: 30 };

        const response = await request(app)
            .post('/services')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidData);

        expect(response.status).toBe(400);
    });

    it('deve retornar 409 Conflict quando nome do servico ja existir', async () => {
        const serviceData = { name: 'Barba', price: 25.0, durationMin: 20 };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-id' });

        const response = await request(app)
            .post('/services')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(serviceData);

        expect(response.status).toBe(409);
        expect(response.body.message).toMatch(/já existe/i);
    });

    it('deve retornar 401 Unauthorized sem token de autenticacao', async () => {
        const response = await request(app)
            .post('/services')
            .send({ name: 'Corte', price: 30, durationMin: 30 });

        expect(response.status).toBe(401);
    });

    it('deve retornar 403 Forbidden para role BARBER ao criar servico', async () => {
        const response = await request(app)
            .post('/services')
            .set('Authorization', `Bearer ${barberToken}`)
            .send({ name: 'Corte', price: 30, durationMin: 30 });

        expect(response.status).toBe(403);
    });

    // ── GET /services ───────────────────────────────────────────────────────

    it('deve retornar 200 OK com lista de servicos', async () => {
        const services = [
            { id: uuidv4(), tenantId, name: 'Corte', price: 30, durationMin: 30, active: true },
            { id: uuidv4(), tenantId, name: 'Barba', price: 20, durationMin: 15, active: true },
        ];

        (prisma.service.findMany as jest.Mock).mockResolvedValue(services);

        const response = await request(app)
            .get('/services')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('name');
    });

    // ── PATCH /services/:id ─────────────────────────────────────────────────

    it('deve retornar 200 OK ao atualizar servico existente', async () => {
        const serviceId = uuidv4();
        const existing = { id: serviceId, tenantId, name: 'Corte', price: 30, durationMin: 30 };
        const updated = { ...existing, price: 35 };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.service.update as jest.Mock).mockResolvedValue(updated);

        const response = await request(app)
            .patch(`/services/${serviceId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ price: 35 });

        expect(response.status).toBe(200);
        expect(response.body.price).toBe(35);
    });

    // ── DELETE /services/:id ────────────────────────────────────────────────

    it('deve retornar 204 No Content ao desativar servico', async () => {
        const serviceId = uuidv4();
        const existing = { id: serviceId, tenantId, name: 'Corte', price: 30, active: true };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.service.update as jest.Mock).mockResolvedValue({ ...existing, active: false });

        const response = await request(app)
            .delete(`/services/${serviceId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(204);
    });
});
