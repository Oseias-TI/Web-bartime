import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../../../shared/errors/AppError';
import { RegisterInput } from '../dtos/RegisterSchema';
import { RefreshTokenService } from './RefreshTokenService';
import { SendVerificationEmailService } from './SendVerificationEmailService';

// LGPD: Versão atual da política de privacidade — atualizar sempre que a política mudar
export const CURRENT_PRIVACY_VERSION = '2026-06-11';

export class RegisterTenantService {
    async execute({ tenantName, cnpj, adminName, email, password, consentVersion, consentIp }: RegisterInput) {
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
        const privacyVersion = consentVersion || CURRENT_PRIVACY_VERSION;

        const { tenant, admin } = await prisma.$transaction(async tx => {
            const tenant = await tx.tenant.create({
                data: {
                    name: tenantName,
                    slug,
                    cnpj,
                    subscriptionStatus: 'TRIAL',
                    // BUG-08: Definir data de expiração do trial (14 dias)
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                },
            });
            const admin = await tx.professional.create({
                data: {
                    tenantId: tenant.id,
                    name: adminName,
                    email,
                    password: passwordHash,
                    role: 'ADMIN',
                    emailVerified: false,
                    // LGPD: Registrar consentimento no momento do cadastro
                    consentedAt: new Date(),
                    consentVersion: privacyVersion,
                    consentIp: consentIp || null,
                },
            });

            // Criar horários de funcionamento padrão (Seg a Sex, 09:00 as 18:00)
            const defaultBusinessHours = Array.from({ length: 7 }).map((_, i) => ({
                tenantId: tenant.id,
                dayOfWeek: i,
                open: i > 0 && i < 6,
                openTime: i > 0 && i < 6 ? "09:00" : null,
                closeTime: i > 0 && i < 6 ? "18:00" : null,
            }));

            await tx.businessHour.createMany({
                data: defaultBusinessHours,
            });

            // LGPD: Criar registro de consentimento no audit trail
            await tx.consentLog.create({
                data: {
                    professionalId: admin.id,
                    action: 'GRANTED',
                    consentVersion: privacyVersion,
                    ipAddress: consentIp || null,
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
                slug: tenant.slug,
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