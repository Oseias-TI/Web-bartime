import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

export class PayoutProfessionalService {
    async execute({ professionalId, tenantId }: { professionalId: string; tenantId: string }) {
        return prisma.$transaction(async tx => {
            const pending = await tx.commission.findMany({ where: { tenantId, professionalId, status: 'PENDING' } });
            if (pending.length === 0) throw new AppError('Nenhuma comissão pendente para este profissional.', 404);
            const totalPaid = pending.reduce((acc, c) => acc + Number(c.amount), 0);
            await tx.commission.updateMany({ where: { tenantId, professionalId, status: 'PENDING' }, data: { status: 'PAID' } });
            return { totalPaid: Number(totalPaid.toFixed(2)), count: pending.length, professionalId };
        });
    }
}