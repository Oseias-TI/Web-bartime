import request from 'supertest';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        transaction: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            aggregate: jest.fn(),
            groupBy: jest.fn(),
        },
        commission: {
            aggregate: jest.fn(),
            findMany: jest.fn(),
            updateMany: jest.fn(),
        },
        professional: {
            findUnique: jest.fn(),
        },
        $transaction: jest.fn(),
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

describe('FinancialController (Integration)', () => {
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

it('deve retornar 201 Created ao criar transacao com dados validos', async () => {
        const txData = {
            type: 'INCOME',
            category: 'Serviço',
            amount: 50.0,
            description: 'Corte de cabelo',
            paymentMethod: 'PIX',
        };

        const created = { id: uuidv4(), tenantId, ...txData, appointmentId: null, createdAt: new Date().toISOString() };
        (prisma.transaction.create as jest.Mock).mockResolvedValue(created);

        const response = await request(app)
            .post('/financial/transactions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(txData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.type).toBe('INCOME');
        expect(response.body.amount).toBe(50.0);
    });

    it('deve retornar 400 Bad Request com dados invalidos (amount negativo)', async () => {
        const invalidData = {
            type: 'INCOME',
            category: 'Serviço',
            amount: -10,
        };

        const response = await request(app)
            .post('/financial/transactions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidData);

        expect(response.status).toBe(400);
    });

    it('deve retornar 403 Forbidden para role BARBER ao criar transacao', async () => {
        const response = await request(app)
            .post('/financial/transactions')
            .set('Authorization', `Bearer ${barberToken}`)
            .send({ type: 'INCOME', category: 'Serviço', amount: 50 });

        expect(response.status).toBe(403);
    });

it('deve retornar 200 OK com lista de transacoes por periodo', async () => {
        const transactions = [
            { id: uuidv4(), tenantId, type: 'INCOME', category: 'Serviço', amount: 50, createdAt: '2030-01-15T10:00:00Z' },
            { id: uuidv4(), tenantId, type: 'EXPENSE', category: 'Aluguel', amount: 200, createdAt: '2030-01-16T10:00:00Z' },
        ];

        (prisma.transaction.findMany as jest.Mock).mockResolvedValue(transactions);

        const response = await request(app)
            .get('/financial/transactions')
            .query({ start: '2030-01-01', end: '2030-01-31' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
    });

it('deve retornar 200 OK ao excluir transacao manual', async () => {
        const txId = uuidv4();
        const existing = { id: txId, tenantId, type: 'EXPENSE', appointmentId: null };

        (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.transaction.delete as jest.Mock).mockResolvedValue(existing);

        const response = await request(app)
            .delete(`/financial/transactions/${txId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toMatch(/excluída/i);
    });

    it('deve retornar 404 Not Found ao excluir transacao inexistente', async () => {
        (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .delete(`/financial/transactions/${uuidv4()}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/não encontrada/i);
    });
});
