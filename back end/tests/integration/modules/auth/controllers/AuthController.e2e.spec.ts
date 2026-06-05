import request from 'supertest';
import bcrypt from 'bcryptjs';

// ── Mock do Prisma ────────────────────────────────────────────────────────
jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        professional: {
            findFirst: jest.fn(),
        },
        tenant: {
            findUnique: jest.fn(),
        },
        refreshToken: {
            create: jest.fn().mockResolvedValue({ id: 'rt-1', token: 'refresh-token' }),
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

// ── Mock do Rate Limiter (evita 429 Too Many Requests) ────────────────────
jest.mock('../../../../../src/shared/middlewares/rateLimiter', () => ({
    globalLimiter: (req: any, res: any, next: any) => next(),
    authLimiter: (req: any, res: any, next: any) => next(),
    registerLimiter: (req: any, res: any, next: any) => next(),
}));

import { app } from '../../../../../src/app';
import { prisma } from '../../../../../src/lib/prisma';

describe('AuthController (Integration)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve retornar 200 OK ao autenticar com credenciais validas', async () => {
        // Arrange
        const email = 'admin@teste.com';
        const password = 'Password123';
        const hashedPassword = await bcrypt.hash(password, 8);

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue({
            id: 'prof-1',
            tenantId: 'tenant-1',
            name: 'Admin',
            email,
            password: hashedPassword, // match real bcrypt.compare
            role: 'ADMIN',
            active: true,
        });

        (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
            id: 'tenant-1',
            name: 'Barbearia Teste',
        });

        // Act
        const response = await request(app)
            .post('/auth/business')
            .send({ email, password });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body.professional).toHaveProperty('email', email);
    });

    it('deve retornar 401 Unauthorized se a senha estiver incorreta', async () => {
        // Arrange
        const email = 'admin@teste.com';
        const password = 'WrongPassword';
        const hashedPassword = await bcrypt.hash('CorrectPassword123', 8);

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue({
            id: 'prof-1',
            tenantId: 'tenant-1',
            email,
            password: hashedPassword,
            active: true,
        });

        // Act
        const response = await request(app)
            .post('/auth/business')
            .send({ email, password });

        // Assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/incorretos/i);
    });
});
