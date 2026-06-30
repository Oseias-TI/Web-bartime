import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../../../shared/errors/AppError';
import { AuthInput } from '../dtos/AuthSchema';
import { RefreshTokenService } from './RefreshTokenService';

export class AuthenticateBusinessService {
    async execute({ email, password }: AuthInput) {
        const professional = await prisma.professional.findFirst({
            where: { email, active: true },
            orderBy: { role: 'desc' }
        });

        if (!professional) throw new AppError('E-mail ou senha incorretos.', 401);

        const passwordMatch = await bcrypt.compare(password, professional.password);
        if (!passwordMatch) throw new AppError('E-mail ou senha incorretos.', 401);

        const tenant = await prisma.tenant.findUnique({
            where: { id: professional.tenantId }
        });

        if (!tenant) throw new AppError('Tenant não encontrado.', 404);

        if (tenant.subscriptionStatus === 'CANCELED' && professional.role !== 'SUPER_ADMIN') {
            throw new AppError('Esta barbearia foi desativada. Entre em contato com o suporte.', 403);
        }

        const { accessToken, refreshToken, expiresIn } =
            await new RefreshTokenService().generateTokens(
                professional.id,
                professional.tenantId,
                professional.role
            );

        return {
            token: accessToken,
            accessToken,
            refreshToken,
            expiresIn,
            professional: {
                id: professional.id,
                tenantId: professional.tenantId,
                name: professional.name,
                email: professional.email,
                avatarUrl: professional.avatarUrl,
                commissionRate: Number(professional.commissionRate ?? 0),
                role: professional.role,
                active: professional.active,
                emailVerified: professional.emailVerified
            },
            tenant: {
                id: tenant.id,
                name: tenant.name,
                cnpj: tenant.cnpj,
                slug: tenant.slug,
                logoUrl: tenant.logoUrl,
                subscriptionStatus: tenant.subscriptionStatus
            }
        };
    }
}