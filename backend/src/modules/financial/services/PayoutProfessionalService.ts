import { ICommissionRepository } from '../repositories/ICommissionRepository';
import { PrismaCommissionRepository } from '../repositories/implementations/PrismaCommissionRepository';
import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

export class PayoutProfessionalService {
    constructor(
        private commissionRepository: ICommissionRepository = new PrismaCommissionRepository()
    ) {}

    async execute({ professionalId, tenantId }: { professionalId: string; tenantId: string }) {
        const professional = await prisma.professional.findUnique({ 
            where: { id: professionalId }, 
            select: { name: true } 
        });

        if (!professional) {
            throw new AppError('Profissional não encontrado.', 404);
        }

        return this.commissionRepository.payoutProfessional(tenantId, professionalId, professional.name);
    }
}