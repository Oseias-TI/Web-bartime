import { ICommissionRepository } from '../repositories/ICommissionRepository';
import { PrismaCommissionRepository } from '../repositories/implementations/PrismaCommissionRepository';
import { prisma } from '../../../lib/prisma'; // Only to find professional name if needed, or we can use another repo. Wait, I should fetch professional name here or in repo?
// Actually, it's better to fetch professional name here and pass it.
import { AppError } from '../../../shared/errors/AppError';

export class PayoutProfessionalService {
    constructor(
        private commissionRepository: ICommissionRepository = new PrismaCommissionRepository()
    ) {}

    async execute({ professionalId, tenantId }: { professionalId: string; tenantId: string }) {
        // Fetch professional name first (this would ideally use IProfessionalRepository in the future)
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