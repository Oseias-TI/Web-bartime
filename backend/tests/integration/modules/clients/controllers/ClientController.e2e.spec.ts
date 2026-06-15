import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

// ── Mock do Prisma (deve vir ANTES de qualquer import que o carregue) ──────
jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        client: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        tenant: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
    },
}));

// ── Mock do Redis ──────────────────────────────────────────────────────────
jest.mock('../../../../../src/lib/redis', () => ({
    redisClient: {
        del: jest.fn(),
        get: jest.fn(),
        setEx: jest.fn(),
        isReady: false, // desabilita cache nos testes
    },
}));

// ── Mock do Logger (evita conectar ao Elasticsearch durante testes) ────────
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

// ── Mock do checkSubscription (evita verificação de assinatura no banco) ──
jest.mock('../../../../../src/shared/middlewares/checkSubscription', () => ({
    checkSubscription: (req: any, res: any, next: any) => next(),
}));

// ── Mock do auditLogger (evita escrita de auditoria no banco) ─────────────
jest.mock('../../../../../src/shared/middlewares/auditLogger', () => ({
    auditLog: () => (req: any, res: any, next: any) => next(),
}));

import { app } from '../../../../../src/app';
import { prisma } from '../../../../../src/lib/prisma';
import jwt from 'jsonwebtoken';

/**
 * Gera um JWT de teste simulando um profissional autenticado.
 */
const generateToken = (tenantId: string, professionalId: string, role: string) => {
    return jwt.sign({ tenantId, role }, process.env.JWT_SECRET || 'secret', {
        subject: professionalId,
        expiresIn: '1h',
    });
};

describe('ClientController (Integration)', () => {
    let token: string;
    const tenantId = 'tenant-123';

    beforeAll(() => {
        token = generateToken(tenantId, 'prof-123', 'ADMIN');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── Teste de Contrato: POST /clients → 201 Created ──────────────────────
    it('deve retornar 201 Created quando o cliente for criado com sucesso', async () => {
        // Arrange
        const clientData = {
            name: 'Cliente E2E',
            phone: '11999999999',
            preferences: 'Nenhuma',
        };

        const createdClient = { id: uuidv4(), tenantId, ...clientData };

        (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.client.create as jest.Mock).mockResolvedValue(createdClient);

        // Act
        const response = await request(app)
            .post('/clients')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(clientData.name);
    });

    // ── Teste de Schema/Validação: POST /clients → 400 Bad Request ──────────
    it('deve retornar 400 Bad Request quando dados de entrada forem invalidos', async () => {
        // Arrange — nome vazio (Zod min(3) rejeita) e telefone curto
        const invalidData = {
            name: '',
            phone: '123',
        };

        // Act
        const response = await request(app)
            .post('/clients')
            .set('Authorization', `Bearer ${token}`)
            .send(invalidData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/validação/i);
    });

    // ── Teste de Negócio: POST /clients → 409 Conflict ──────────────────────
    it('deve retornar 409 Conflict quando o telefone ja estiver cadastrado', async () => {
        // Arrange
        const clientData = {
            name: 'Cliente Duplicado',
            phone: '11999999999',
        };

        (prisma.client.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

        // Act
        const response = await request(app)
            .post('/clients')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);

        // Assert
        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/já cadastrado/i);
    });
});
