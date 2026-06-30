import Stripe from 'stripe';
import { stripe } from '../../../shared/utils/stripe';
import { SubscriptionStatus } from '@prisma/client';
import { ITenantBillingRepository } from '../repositories/ITenantBillingRepository';
import { PrismaTenantBillingRepository } from '../repositories/implementations/PrismaTenantBillingRepository';

function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
        active: SubscriptionStatus.ACTIVE, trialing: SubscriptionStatus.ACTIVE, past_due: SubscriptionStatus.PAST_DUE, canceled: SubscriptionStatus.CANCELED,
        unpaid: SubscriptionStatus.UNPAID, incomplete: SubscriptionStatus.PAST_DUE, incomplete_expired: SubscriptionStatus.CANCELED, paused: SubscriptionStatus.PAST_DUE,
    };
    return map[stripeStatus] ?? SubscriptionStatus.PAST_DUE;
}

export class StripeWebhookService {
    constructor(
        private tenantRepository: ITenantBillingRepository = new PrismaTenantBillingRepository()
    ) {}

    constructEvent(payload: Buffer, signature: string): Stripe.Event {
        return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
    }

    async handleEvent(event: Stripe.Event): Promise<void> {
        console.log(`[Stripe Webhook] ${event.type}`);
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            case 'invoice.paid':
                await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;
            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;
            default:
                console.log(`[Stripe Webhook] Evento ignorado: ${event.type}`);
        }
    }

    private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
        const tenantId = session.metadata?.tenantId;
        if (!tenantId) return;

        if (!session.subscription) return;

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await this.tenantRepository.updateSubscriptionStatus(tenantId, {
            status: mapStripeStatus(subscription.status),
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
        });
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const tenant = await this.tenantRepository.findByStripeSubscriptionId(subscription.id);
        if (!tenant) return;

        await this.tenantRepository.updateSubscriptionStatus(tenant.id, {
            status: mapStripeStatus(subscription.status),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
        });
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const tenant = await this.tenantRepository.findByStripeSubscriptionId(subscription.id);
        if (!tenant) return;

        await this.tenantRepository.updateSubscriptionStatus(tenant.id, {
            status: 'CANCELED',
            stripeSubscriptionId: null,
            currentPeriodEnd: null
        });
    }

    private async handleInvoicePaid(invoice: Stripe.Invoice) {
        if (!invoice.subscription) return;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const tenant = await this.tenantRepository.findByStripeSubscriptionId(subscription.id);
        if (!tenant) return;

        await this.tenantRepository.updateSubscriptionStatus(tenant.id, {
            status: 'ACTIVE',
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
        });
    }

    private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
        if (!invoice.subscription) return;
        const tenant = await this.tenantRepository.findByStripeSubscriptionId(invoice.subscription as string);
        if (!tenant) return;

        await this.tenantRepository.updateSubscriptionStatus(tenant.id, {
            status: 'PAST_DUE'
        });
    }
}