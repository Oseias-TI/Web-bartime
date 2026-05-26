import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../../../shared/errors/AppError';
import { RegisterInput } from '../dtos/RegisterSchema';
import { RefreshTokenService } from './RefreshTokenService';
import { SendVerificationEmailService } from './SendVerificationEmailService';

export class RegisterTenantService {
    async execute({ tenantName, cnpj, adminName, email, password }: RegisterInput) {
        const cnpjExists = await prisma.tenant.findUnique({ where: { cnpj } });
        if (cnpjExists) throw new AppError('Este CNPJ já está cadastrado.', 409);

        // BUG-06: Removida verificação global de e-mail — a constraint @@unique([tenantId, email])
        // do schema já garante unicidade por tenant. Verificar globalmente impedia e-mails válidos
        // de profissionais que trabalham em múltiplas barbearias.

        // Gerar slug único
        let baseSlug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!baseSlug) baseSlug = 'barbearia';
        let slug = baseSlug;
        let slugCounter = 1;
        while (await prisma.tenant.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${slugCounter}`;
            slugCounter++;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const { tenant, admin } = await prisma.$transaction(async tx => {
            const tenant = await tx.tenant.create({
                data: { name: tenantName, slug, cnpj, subscriptionStatus: 'TRIAL' },
            });
            const admin = await tx.professional.create({
                data: {
                    tenantId: tenant.id,
                    name: adminName,
                    email,
                    password: passwordHash,
                    role: 'ADMIN',
                    emailVerified: false,
                },
            });
            return { tenant, admin };
        });

        const { accessToken, refreshToken, expiresIn } =
            await new RefreshTokenService().generateTokens(admin.id, tenant.id, admin.role);

        // Dispara o e-mail de verificação sem bloquear a resposta
        new SendVerificationEmailService().execute(admin.id).catch(err => {
            console.error('[RegisterTenantService] Erro ao enviar e-mail de verificação:', err);
        });

        return {
            token: accessToken,
            accessToken,
            refreshToken,
            expiresIn,
            emailVerified: false,
            tenant: { 
                id: tenant.id, 
                name: tenant.name,
                cnpj: tenant.cnpj,
                logoUrl: tenant.logoUrl,
                subscriptionStatus: tenant.subscriptionStatus
            },
            professional: { 
                id: admin.id, 
                tenantId: admin.tenantId,
                name: admin.name, 
                email: admin.email, 
                avatarUrl: admin.avatarUrl,
                commissionRate: Number(admin.commissionRate ?? 0),
                role: admin.role,
                active: admin.active,
                emailVerified: admin.emailVerified
            },
        };
    }
}