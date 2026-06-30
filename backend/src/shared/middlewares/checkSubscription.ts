import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

const BLOCKED_STATUSES = ['CANCELED', 'UNPAID'];

export async function checkSubscription(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.user.role === 'SUPER_ADMIN') return next();

        const tenant = await prisma.tenant.findUnique({
            where: { id: req.user.tenantId },
            select: { subscriptionStatus: true, trialEndsAt: true, currentPeriodEnd: true },
        });

        if (!tenant) return res.status(404).json({ error: 'Barbearia não encontrada.' });

        if (tenant.subscriptionStatus === 'TRIAL') {
            if (tenant.trialEndsAt && new Date() > tenant.trialEndsAt) {
                return res.status(403).json({
                    error: 'Seu período de teste expirou.',
                    action: 'subscribe',
                    checkoutUrl: '/billing/checkout',
                });
            }
            return next();
        }

        if (tenant.subscriptionStatus === 'PAST_DUE') {
            const gracePeriodEnd = tenant.currentPeriodEnd
                ? new Date(tenant.currentPeriodEnd.getTime() + 3 * 86_400_000)
                : null;

            if (gracePeriodEnd && new Date() > gracePeriodEnd) {
                return res.status(403).json({
                    error: 'Pagamento em atraso. Acesso bloqueado após período de graça.',
                    action: 'pay',
                    portalUrl: '/billing/portal',
                });
            }

            res.setHeader('X-Subscription-Warning', 'Pagamento pendente. Regularize sua assinatura.');
            return next();
        }

        if (BLOCKED_STATUSES.includes(tenant.subscriptionStatus)) {
            return res.status(403).json({
                error: 'Assinatura inativa.',
                action: 'subscribe',
                checkoutUrl: '/billing/checkout',
            });
        }

        return next();
    } catch (err) {
        return next(err);
    }
}