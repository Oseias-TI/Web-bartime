import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../../../shared/errors/AppError';
import { RegisterInput } from '../dtos/RegisterSchema';
import { RefreshTokenService } from './RefreshTokenService';
import { SendVerificationEmailService } from './SendVerificationEmailService';

export const CURRENT_PRIVACY_VERSION = '2026-06-11';

export class RegisterTenantService {
    async execute({ tenantName, cnpj, adminName, email, password, consentVersion, consentIp }: RegisterInput) {
        const cnpjExists = await prisma.tenant.findUnique({ where: { cnpj } });
        if (cnpjExists) throw new AppError('Este CNPJ já está cadastrado.', 409);

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
                    consentedAt: new Date(),
                    consentVersion: privacyVersion,
                    consentIp: consentIp || null,
                },
            });

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