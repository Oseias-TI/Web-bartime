import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

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

import { app } from '../../../../../src/app';
import { prisma } from '../../../../../src/lib/prisma';
import jwt from 'jsonwebtoken';

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

    it('deve retornar 201 Created quando o cliente for criado com sucesso', async () => {
        const clientData = {
            name: 'Cliente E2E',
            phone: '11999999999',
            preferences: 'Nenhuma',
        };

        const createdClient = { id: uuidv4(), tenantId, ...clientData };

        (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.client.create as jest.Mock).mockResolvedValue(createdClient);

        const response = await request(app)
            .post('/clients')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(clientData.name);
    });

    it('deve retornar 400 Bad Request quando dados de entrada forem invalidos', async () => {
        const invalidData = {
            name: '',
            phone: '123',
        };

        const response = await request(app)
            .post('/clients')
            .set('Authorization', `Bearer ${token}`)
            .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/validação/i);
    });

    it('deve retornar 409 Conflict quando o telefone ja estiver cadastrado', async () => {
        const clientData = {
            name: 'Cliente Duplicado',
            phone: '11999999999',
        };

        (prisma.client.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

        const response = await request(app)
            .post('/clients')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/já cadastrado/i);
    });
});
