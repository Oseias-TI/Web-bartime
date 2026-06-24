import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../../shared/errors/AppError';
import { RefreshTokenService } from '../../auth/services/RefreshTokenService';
import { CURRENT_PRIVACY_VERSION } from '../../auth/services/RegisterTenantService';

interface ClientLoginInput {
    slug: string;
    emailOrPhone: string;
    password?: string;
}

interface ClientSetupInput {
    slug: string;
    emailOrPhone: string;
    password: string;
}

interface ClientRegisterInput {
    slug: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    consentVersion?: string;
    consentIp?: string;
}

export class ClientAuthService {
    async registerClient(data: ClientRegisterInput) {
        if (!data.password) throw new AppError('Senha é obrigatória.', 400);

        const tenant = await prisma.tenant.findUnique({ where: { slug: data.slug } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        const emailClean = data.email ? data.email.trim() : null;

        // Check if email already exists
        if (emailClean) {
            const existingEmail = await prisma.client.findFirst({
                where: { tenantId: tenant.id, email: emailClean }
            });
            if (existingEmail) {
                throw new AppError('Este e-mail já está cadastrado. Faça login ou recupere sua senha.', 400);
            }
        }

        const cleanPhone = data.phone.replace(/\D/g, '');

        // Check if phone already exists
        if (cleanPhone) {
            const existingPhone = await prisma.client.findFirst({
                where: { tenantId: tenant.id, phone: cleanPhone }
            });
            if (existingPhone) {
                throw new AppError('Este telefone (WhatsApp) já está cadastrado. Faça login com ele.', 400);
            }
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const privacyVersion = data.consentVersion || CURRENT_PRIVACY_VERSION;

        // LGPD: Criar cliente e registro de consentimento em transação
        const client = await prisma.$transaction(async tx => {
            const client = await tx.client.create({
                data: {
                    tenantId: tenant.id,
                    name: data.name,
                    email: emailClean,
                    phone: cleanPhone,
                    password: passwordHash,
                    // LGPD: Registrar consentimento no momento do cadastro
                    consentedAt: new Date(),
                    consentVersion: privacyVersion,
                    consentIp: data.consentIp || null,
                }
            });

            // LGPD: Criar registro de consentimento no audit trail
            await tx.consentLog.create({
                data: {
                    clientId: client.id,
                    action: 'GRANTED',
                    consentVersion: privacyVersion,
                    ipAddress: data.consentIp || null,
                },
            });

            return client;
        });

        const token = jwt.sign(
            { tenantId: tenant.id, role: 'CLIENT' },
            process.env.JWT_SECRET as string,
            { subject: client.id, expiresIn: '30d' }
        );

        return {
            token,
            client: {
                id: client.id,
                tenantId: client.tenantId,
                name: client.name,
                phone: client.phone,
                email: client.email
            },
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug
            }
        };
    }
    async login({ slug, emailOrPhone, password }: ClientLoginInput) {
        if (!password) throw new AppError('Senha é obrigatória.', 400);

        const tenant = await prisma.tenant.findUnique({ where: { slug } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        // Se contiver '@', é email. Se não, assumimos que é telefone e removemos formatação.
        const isEmail = emailOrPhone.includes('@');
        const cleanContact = isEmail ? emailOrPhone.trim() : emailOrPhone.replace(/\D/g, '');

        const client = await prisma.client.findFirst({
            where: {
                tenantId: tenant.id,
                OR: [
                    { email: cleanContact },
                    { phone: cleanContact }
                ]
            }
        });

        if (!client) throw new AppError('Cliente não encontrado.', 404);
        if (!client.password) throw new AppError('Senha não configurada. Por favor, crie sua senha no Primeiro Acesso.', 400);

        const passwordMatch = await bcrypt.compare(password, client.password);
        if (!passwordMatch) throw new AppError('Credenciais inválidas.', 401);

        const token = jwt.sign(
            { tenantId: tenant.id, role: 'CLIENT' },
            process.env.JWT_SECRET as string,
            { subject: client.id, expiresIn: '30d' }
        );

        return {
            token,
            client: {
                id: client.id,
                tenantId: client.tenantId,
                name: client.name,
                phone: client.phone,
                email: client.email
            },
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug
            }
        };
    }

    async setupPassword({ slug, emailOrPhone, password }: ClientSetupInput) {
        if (!password) throw new AppError('Senha é obrigatória.', 400);

        const tenant = await prisma.tenant.findUnique({ where: { slug } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        // Se contiver '@', é email. Se não, assumimos que é telefone e removemos formatação.
        const isEmail = emailOrPhone.includes('@');
        const cleanContact = isEmail ? emailOrPhone.trim() : emailOrPhone.replace(/\D/g, '');

        const client = await prisma.client.findFirst({
            where: {
                tenantId: tenant.id,
                OR: [
                    { email: cleanContact },
                    { phone: cleanContact }
                ]
            }
        });

        if (!client) throw new AppError('Cliente não encontrado.', 404);
        if (client.password) throw new AppError('Este cliente já possui senha configurada. Por favor, faça login.', 400);

        const passwordHash = await bcrypt.hash(password, 10);

        const updatedClient = await prisma.client.update({
            where: { id: client.id },
            data: { password: passwordHash }
        });

        return this.login({ slug, emailOrPhone, password });
    }

    async findTenants(contact: string) {
        if (!contact) throw new AppError('Contato é obrigatório.', 400);

        const isEmail = contact.includes('@');
        const cleanContact = isEmail ? contact.trim() : contact.replace(/\D/g, '');

        const clients = await prisma.client.findMany({
            where: {
                OR: [
                    { email: cleanContact },
                    { phone: cleanContact }
                ]
            },
            include: {
                tenant: {
                    select: {
                        slug: true,
                        name: true,
                        logoUrl: true
                    }
                }
            }
        });

        // Filter out null tenants (just in case) and return unique ones
        const uniqueTenants = new Map();
        for (const client of clients) {
            if (client.tenant && !uniqueTenants.has(client.tenant.slug)) {
                uniqueTenants.set(client.tenant.slug, client.tenant);
            }
        }

        return Array.from(uniqueTenants.values());
    }
}
