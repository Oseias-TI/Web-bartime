import { prisma } from '../../../../lib/prisma';
import { ICommissionRepository } from '../ICommissionRepository';
import { AppError } from '../../../../shared/errors/AppError';

export class PrismaCommissionRepository implements ICommissionRepository {
    async aggregatePending(tenantId: string): Promise<number> {
        const commissionsPending = await prisma.commission.aggregate({ 
            where: { tenantId, status: 'PENDING' }, 
            _sum: { amount: true } 
        });
        return Number(commissionsPending._sum.amount ?? 0);
    }

    async payoutProfessional(tenantId: string, professionalId: string, professionalName: string): Promise<{ totalPaid: number, count: number, professionalId: string }> {
        return prisma.$transaction(async tx => {
            const pending = await tx.commission.findMany({ 
                where: { tenantId, professionalId, status: 'PENDING' } 
            });
            
            if (pending.length === 0) {
                throw new AppError('Nenhuma comissão pendente para este profissional.', 404);
            }
            
            const totalPaid = pending.reduce((acc, c) => acc + Number(c.amount), 0);
            
            await tx.commission.updateMany({ 
                where: { tenantId, professionalId, status: 'PENDING' }, 
                data: { status: 'PAID' } 
            });

            await tx.transaction.create({
                data: {
                    tenantId,
                    type: 'EXPENSE',
                    category: 'Pagamento de Comissão',
                    description: `Comissão paga para ${professionalName} (${pending.length} atend.)`,
                    amount: totalPaid,
                    paymentMethod: 'Pix'
                }
            });

            return { totalPaid: Number(totalPaid.toFixed(2)), count: pending.length, professionalId };
        });
    }
}
