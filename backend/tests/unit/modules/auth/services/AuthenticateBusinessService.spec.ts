import { AuthenticateBusinessService } from '../../../../../src/modules/auth/services/AuthenticateBusinessService';
import { prisma } from '../../../../../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../../../../../src/shared/errors/AppError';
import { RefreshTokenService } from '../../../../../src/modules/auth/services/RefreshTokenService';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        professional: {
            findFirst: jest.fn(),
        },
        tenant: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}));

jest.mock('../../../../../src/modules/auth/services/RefreshTokenService');

describe('AuthenticateBusinessService (Unit)', () => {
    let authService: AuthenticateBusinessService;

    beforeEach(() => {
        authService = new AuthenticateBusinessService();
        jest.clearAllMocks();
    });

    it('deve autenticar e retornar tokens quando as credenciais forem validas', async () => {
        const email = 'test@example.com';
        const password = 'Password123';
        
        const professionalData = {
            id: 'prof-1',
            tenantId: 'tenant-1',
            name: 'Prof Teste',
            email,
            password: 'hashed-password',
            role: 'ADMIN',
            active: true,
            commissionRate: 50,
            avatarUrl: null,
            emailVerified: true
        };

        const tenantData = {
            id: 'tenant-1',
            name: 'Barbearia Teste',
            cnpj: '00000000000000',
            logoUrl: null,
            subscriptionStatus: 'ACTIVE'
        };

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(professionalData);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(tenantData);

        const mockGenerateTokens = jest.fn().mockResolvedValue({
            accessToken: 'fake-access-token',
            refreshToken: 'fake-refresh-token',
            expiresIn: 3600
        });

        (RefreshTokenService.prototype.generateTokens as jest.Mock) = mockGenerateTokens;

        const result = await authService.execute({ email, password });

        expect(prisma.professional.findFirst).toHaveBeenCalledWith({
            where: { email, active: true },
            orderBy: { role: 'desc' },
        });
        expect(bcrypt.compare).toHaveBeenCalledWith(password, professionalData.password);
        expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { id: professionalData.tenantId } });
        expect(mockGenerateTokens).toHaveBeenCalledWith(professionalData.id, professionalData.tenantId, professionalData.role);
        
        expect(result).toHaveProperty('token', 'fake-access-token');
        expect(result).toHaveProperty('refreshToken', 'fake-refresh-token');
        expect(result.professional).toHaveProperty('email', email);
        expect(result.tenant).toHaveProperty('name', tenantData.name);
    });

    it('deve lancar AppError quando o email nao for encontrado', async () => {
        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(authService.execute({ email: 'wrong@test.com', password: '123' }))
            .rejects.toBeInstanceOf(AppError);
        expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lancar AppError quando a senha estiver incorreta', async () => {
        (prisma.professional.findFirst as jest.Mock).mockResolvedValue({ password: 'hashed-password' });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(authService.execute({ email: 'test@example.com', password: 'wrong' }))
            .rejects.toBeInstanceOf(AppError);
        expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
    });
});
