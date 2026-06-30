import cron from 'node-cron';
import { prisma } from '../../lib/prisma';

const INACTIVE_DAYS_THRESHOLD = 730;

async function cleanExpiredTokens() {
    const now = new Date();

    try {
        const deletedPasswordTokens = await prisma.passwordResetToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: now } },
                    { used: true, createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
                ],
            },
        });

        const deletedClientTokens = await prisma.clientPasswordResetToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: now } },
                    { used: true, createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
                ],
            },
        });

        const deletedEmailTokens = await prisma.emailVerificationToken.deleteMany({
            where: { expiresAt: { lt: now } },
        });

        const deletedRefreshTokens = await prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: now } },
        });

        const total = deletedPasswordTokens.count + deletedClientTokens.count +
            deletedEmailTokens.count + deletedRefreshTokens.count;

        if (total > 0) {
            console.log(
                `[LGPD Cleanup] Tokens removidos: ` +
                `password=${deletedPasswordTokens.count}, ` +
                `clientPassword=${deletedClientTokens.count}, ` +
                `emailVerification=${deletedEmailTokens.count}, ` +
                `refreshToken=${deletedRefreshTokens.count}`
            );
        }
    } catch (err) {
        console.error('[LGPD Cleanup] Erro ao limpar tokens expirados:', err);
    }
}

async function anonymizeInactiveClients() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_DAYS_THRESHOLD);

    try {
        const inactiveClients = await prisma.client.findMany({
            where: {
                name: { not: '[Removido]' },
                createdAt: { lt: cutoffDate },
                appointments: {
                    none: {
                        startTime: { gte: cutoffDate },
                    },
                },
            },
            select: { id: true, tenantId: true, consentVersion: true },
        });

        if (inactiveClients.length === 0) return;

        for (const client of inactiveClients) {
            await prisma.$transaction(async tx => {
                await tx.appointment.updateMany({
                    where: { clientId: client.id, status: 'PENDING' },
                    data: { status: 'CANCELED' },
                });

                await tx.client.update({
                    where: { id: client.id },
                    data: {
                        name: '[Removido]',
                        phone: `removed_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                        email: null,
                        password: null,
                        preferences: null,
                        consentedAt: null,
                        consentVersion: null,
                        consentIp: null,
                    },
                });

                await tx.consentLog.create({
                    data: {
                        clientId: client.id,
                        action: 'REVOKED',
                        consentVersion: client.consentVersion || 'unknown',
                    },
                });

                await tx.auditLog.create({
                    data: {
                        tenantId: client.tenantId,
                        action: 'CLIENT_DATA_ANONYMIZED',
                        entity: 'Client',
                        entityId: client.id,
                        metadata: {
                            reason: `LGPD Art. 16 - Anonimização automática após ${INACTIVE_DAYS_THRESHOLD} dias de inatividade`,
                        },
                    },
                });
            });
        }

        console.log(`[LGPD Cleanup] ${inactiveClients.length} cliente(s) inativo(s) anonimizado(s) (>${INACTIVE_DAYS_THRESHOLD} dias).`);
    } catch (err) {
        console.error('[LGPD Cleanup] Erro ao anonimizar clientes inativos:', err);
    }
}

export function startLgpdCleanupJob() {
    cron.schedule('0 3 * * *', async () => {
        console.log('[LGPD Cleanup] Iniciando limpeza de tokens expirados...');
        await cleanExpiredTokens();
    });

    cron.schedule('0 4 * * 0', async () => {
        console.log('[LGPD Cleanup] Iniciando verificação de clientes inativos...');
        await anonymizeInactiveClients();
    });

    console.log('[Jobs] LGPD Cleanup jobs iniciados (tokens: diário 03h | inativos: domingo 04h).');
}
