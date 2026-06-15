import { prisma } from '../../../lib/prisma';
import { stripe } from '../../../shared/utils/stripe';
import { AppError } from '../../../shared/errors/AppError';

export class CreatePortalSessionService {
    async execute(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);
        if (!tenant.stripeCustomerId) throw new AppError('Nenhuma assinatura encontrada. Contrate um plano primeiro.', 400);

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: tenant.stripeCustomerId,
            return_url: process.env.STRIPE_CANCEL_URL as string,
        });

        return { url: portalSession.url };
    }
}