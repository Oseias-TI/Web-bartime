export interface ICommissionRepository {
    aggregatePending(tenantId: string): Promise<number>;
    payoutProfessional(tenantId: string, professionalId: string, professionalName: string): Promise<{ totalPaid: number, count: number, professionalId: string }>;
}
