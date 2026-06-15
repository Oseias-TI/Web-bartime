import { SubscriptionStatus } from '@prisma/client';

export interface ITenantBillingData {
    id: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    subscriptionStatus: SubscriptionStatus;
    currentPeriodEnd: Date | null;
    trialEndsAt: Date | null;
}

export interface IUpdateSubscriptionData {
    status: SubscriptionStatus;
    currentPeriodEnd?: Date | null;
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string;
}

export interface ITenantBillingRepository {
    findById(tenantId: string): Promise<ITenantBillingData | null>;
    findByStripeSubscriptionId(subId: string): Promise<ITenantBillingData | null>;
    updateStripeCustomerId(tenantId: string, customerId: string): Promise<void>;
    updateSubscriptionStatus(tenantId: string, data: IUpdateSubscriptionData): Promise<void>;
}
