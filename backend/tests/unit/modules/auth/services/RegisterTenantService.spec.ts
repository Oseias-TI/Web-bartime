import { RegisterTenantService } from '../../../../../src/modules/auth/services/RegisterTenantService';
import { prisma } from '../../../../../src/lib/prisma';
import { AppError } from '../../../../../src/shared/errors/AppError';
import bcrypt from 'bcryptjs';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        tenant: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        professional: {
            create: jest.fn(),
        },
        businessHour: {
            createMany: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

jest.mock('../../../../../src/modules/auth/services/RefreshTokenService', () => {
    return {
        RefreshTokenService: jest.fn().mockImplementation(() => ({
            generateTokens: jest.fn().mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 3600,
            }),
        })),
    };
});

jest.mock('../../../../../src/modules/auth/services/SendVerificationEmailService', () => {
    return {
        SendVerificationEmailService: jest.fn().mockImplementation(() => ({
            execute: jest.fn().mockResolvedValue(true),
        })),
    };
});

describe('RegisterTenantService (Unit)', () => {
    let registerTenantService: RegisterTenantService;

    beforeEach(() => {
        registerTenantService = new RegisterTenantService();
        jest.clearAllMocks();
    });

    it('deve criar um tenant com sucesso e retornar tokens', async () => {
        (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
        
        (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
            return cb(prisma);
        });

        (prisma.tenant.create as jest.Mock).mockResolvedValue({
            id: 'tenant-1',
            name: 'Barbearia Teste',
            slug: 'barbearia-teste',
            cnpj: '12345678901234',
            logoUrl: null,
            subscriptionStatus: 'TRIAL'
        });

        (prisma.professional.create as jest.Mock).mockResolvedValue({
            id: 'prof-1',
            tenantId: 'tenant-1',
            name: 'Admin Teste',
            email: 'admin@teste.com',
            role: 'ADMIN',
            active: true,
            emailVerified: false,
            commissionRate: 0,
            avatarUrl: null
        });

        const result = await registerTenantService.execute({
            tenantName: 'Barbearia Teste',
            cnpj: '12345678901234',
            adminName: 'Admin Teste',
            email: 'admin@teste.com',
            password: 'Password123'
        });

        expect(result).toHaveProperty('accessToken', 'access-token');
        expect(result.tenant).toHaveProperty('slug', 'barbearia-teste');
        expect(result.professional).toHaveProperty('role', 'ADMIN');
        expect(prisma.tenant.create).toHaveBeenCalled();
        expect(prisma.businessHour.createMany).toHaveBeenCalled();
    });

    it('deve estourar erro (409 Conflict) caso o CNPJ ja esteja cadastrado', async () => {
        (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-tenant' });

        await expect(registerTenantService.execute({
            tenantName: 'Barbearia Teste',
            cnpj: '12345678901234',
            adminName: 'Admin Teste',
            email: 'admin@teste.com',
            password: 'Password123'
        })).rejects.toBeInstanceOf(AppError);

        try {
            await registerTenantService.execute({
                tenantName: 'Barbearia Teste',
                cnpj: '12345678901234',
                adminName: 'Admin Teste',
                email: 'admin@teste.com',
                password: 'Password123'
            });
        } catch (error: any) {
            expect(error.statusCode).toBe(409);
        }
    });

    it('deve gerar multiplos slugs corretamente caso duas barbearias tenham nomes parecidos', async () => {
        // Primeira chamada (procura pelo slug original)
        (prisma.tenant.findUnique as jest.Mock)
            .mockResolvedValueOnce(null) // CNPJ não existe
            .mockResolvedValueOnce({ id: 'tenant-old' }) // slug "barbearia-teste" já existe
            .mockResolvedValueOnce(null); // slug "barbearia-teste-1" não existe

        (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
            return cb(prisma);
        });

        (prisma.tenant.create as jest.Mock).mockResolvedValue({
            id: 'tenant-2',
            name: 'Barbearia Teste',
            slug: 'barbearia-teste-1',
            cnpj: '12345678901234',
            logoUrl: null,
            subscriptionStatus: 'TRIAL'
        });

        (prisma.professional.create as jest.Mock).mockResolvedValue({
            id: 'prof-2',
            tenantId: 'tenant-2',
            name: 'Admin Teste',
            email: 'admin@teste.com',
            role: 'ADMIN',
            active: true,
            emailVerified: false,
            commissionRate: 0,
            avatarUrl: null
        });

        const result = await registerTenantService.execute({
            tenantName: 'Barbearia Teste',
            cnpj: '12345678901234',
            adminName: 'Admin Teste',
            email: 'admin@teste.com',
            password: 'Password123'
        });

        expect(result.tenant).toHaveProperty('slug', 'barbearia-teste-1');
        expect(prisma.tenant.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                slug: 'barbearia-teste-1'
            })
        }));
    });
});
