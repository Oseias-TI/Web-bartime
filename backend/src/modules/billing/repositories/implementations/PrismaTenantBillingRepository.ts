import { prisma } from '../../../../lib/prisma';
import { ITenantBillingRepository, ITenantBillingData, IUpdateSubscriptionData } from '../ITenantBillingRepository';

export class PrismaTenantBillingRepository implements ITenantBillingRepository {
    async findById(tenantId: string): Promise<ITenantBillingData | null> {
        return prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { 
                id: true, 
                stripeCustomerId: true, 
                stripeSubscriptionId: true, 
                subscriptionStatus: true, 
                currentPeriodEnd: true, 
                trialEndsAt: true 
            }
        });
    }

    async findByStripeSubscriptionId(subId: string): Promise<ITenantBillingData | null> {
        return prisma.tenant.findFirst({
            where: { stripeSubscriptionId: subId },
            select: { 
                id: true, 
                stripeCustomerId: true, 
                stripeSubscriptionId: true, 
                subscriptionStatus: true, 
                currentPeriodEnd: true, 
                trialEndsAt: true 
            }
        });
    }

    async updateStripeCustomerId(tenantId: string, customerId: string): Promise<void> {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { stripeCustomerId: customerId }
        });
    }

    async updateSubscriptionStatus(tenantId: string, data: IUpdateSubscriptionData): Promise<void> {
        const updateData: any = { subscriptionStatus: data.status };
        
        if (data.currentPeriodEnd !== undefined) {
            updateData.currentPeriodEnd = data.currentPeriodEnd;
        }
        if (data.stripeSubscriptionId !== undefined) {
            updateData.stripeSubscriptionId = data.stripeSubscriptionId;
        }
        if (data.stripeCustomerId !== undefined) {
            updateData.stripeCustomerId = data.stripeCustomerId;
        }

        await prisma.tenant.update({
            where: { id: tenantId },
            data: updateData
        });
    }
}
