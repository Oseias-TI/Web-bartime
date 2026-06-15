import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

export class PayoutProfessionalService {
    async execute({ professionalId, tenantId }: { professionalId: string; tenantId: string }) {
        return prisma.$transaction(async tx => {
            const pending = await tx.commission.findMany({ where: { tenantId, professionalId, status: 'PENDING' } });
            if (pending.length === 0) throw new AppError('Nenhuma comissão pendente para este profissional.', 404);
            const totalPaid = pending.reduce((acc, c) => acc + Number(c.amount), 0);
            await tx.commission.updateMany({ where: { tenantId, professionalId, status: 'PENDING' }, data: { status: 'PAID' } });

            const professional = await tx.professional.findUnique({ where: { id: professionalId }, select: { name: true } });
            await tx.transaction.create({
                data: {
                    tenantId,
                    type: 'EXPENSE',
                    category: 'Pagamento de Comissão',
                    description: `Comissão paga para ${professional?.name || 'Profissional'} (${pending.length} atend.)`,
                    amount: totalPaid,
                    paymentMethod: 'Pix'
                }
            });

            return { totalPaid: Number(totalPaid.toFixed(2)), count: pending.length, professionalId };
        });
    }
}