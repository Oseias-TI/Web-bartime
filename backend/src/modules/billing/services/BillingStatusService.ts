import { ITenantBillingRepository } from '../repositories/ITenantBillingRepository';
import { PrismaTenantBillingRepository } from '../repositories/implementations/PrismaTenantBillingRepository';
import { AppError } from '../../../shared/errors/AppError';

const STATUS_LABELS: Record<string, string> = {
    TRIAL: 'Período de teste',
    ACTIVE: 'Ativa',
    PAST_DUE: 'Pagamento pendente',
    CANCELED: 'Cancelada',
    UNPAID: 'Inadimplente',
};

export class BillingStatusService {
    constructor(
        private tenantRepository: ITenantBillingRepository = new PrismaTenantBillingRepository()
    ) {}

    async get(tenantId: string) {
        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        const now = new Date();
        const daysUntilEnd = tenant.currentPeriodEnd ? Math.ceil((tenant.currentPeriodEnd.getTime() - now.getTime()) / 86_400_000) : null;
        const daysUntilTrialEnd = tenant.trialEndsAt ? Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / 86_400_000) : null;

        return {
            status: tenant.subscriptionStatus,
            statusLabel: STATUS_LABELS[tenant.subscriptionStatus] ?? tenant.subscriptionStatus,
            currentPeriodEnd: tenant.currentPeriodEnd,
            daysUntilEnd,
            trialEndsAt: tenant.trialEndsAt,
            daysUntilTrialEnd,
            hasActiveSubscription: tenant.subscriptionStatus === 'ACTIVE',
            hasPaymentMethod: !!tenant.stripeCustomerId,
        };
    }
}