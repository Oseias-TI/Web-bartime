import { stripe } from '../../../shared/utils/stripe';
import { AppError } from '../../../shared/errors/AppError';
import { ITenantBillingRepository } from '../repositories/ITenantBillingRepository';
import { PrismaTenantBillingRepository } from '../repositories/implementations/PrismaTenantBillingRepository';

interface CreateCheckoutInput {
    tenantId: string;
    adminEmail: string;
    adminName: string;
}

export class CreateCheckoutSessionService {
    constructor(
        private tenantRepository: ITenantBillingRepository = new PrismaTenantBillingRepository()
    ) {}

    async execute({ tenantId, adminEmail, adminName }: CreateCheckoutInput) {
        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        if (tenant.subscriptionStatus === 'ACTIVE' && tenant.stripeSubscriptionId)
            throw new AppError('Esta barbearia já possui uma assinatura ativa.', 400);

        let customerId = tenant.stripeCustomerId ?? undefined;

        if (!customerId) {
            const customer = await stripe.customers.create({ email: adminEmail, name: adminName, metadata: { tenantId } });
            customerId = customer.id;
            await this.tenantRepository.updateStripeCustomerId(tenantId, customerId);
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: process.env.STRIPE_PRICE_ID as string, quantity: 1 }],
            metadata: { tenantId },
            subscription_data: { metadata: { tenantId }, trial_period_days: tenant.subscriptionStatus === 'TRIAL' ? 14 : undefined },
            success_url: process.env.STRIPE_SUCCESS_URL as string,
            cancel_url: process.env.STRIPE_CANCEL_URL as string,
        });

        return { url: session.url };
    }
}