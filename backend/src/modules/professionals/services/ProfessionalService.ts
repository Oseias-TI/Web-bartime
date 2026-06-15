import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { UpdateProfessionalInput } from '../dtos/UpdateProfessionalSchema';
import { getPaginationParams, buildPaginatedResult, PaginationParams } from '../../../shared/utils/paginate';

export class ProfessionalService {
    async listAll(tenantId: string, params: PaginationParams) {
        const [data, total] = await Promise.all([
            prisma.professional.findMany({
                where: { tenantId },
                select: { id: true, name: true, email: true, role: true, commissionRate: true, avatarUrl: true, active: true, _count: { select: { appointments: true } } },
                orderBy: { name: 'asc' },
                skip: params.skip,
                take: params.limit,
            }),
            prisma.professional.count({ where: { tenantId } }),
        ]);
        return buildPaginatedResult(data, total, params);
    }

    async findById(tenantId: string, professionalId: string) {
        const professional = await prisma.professional.findFirst({
            where: { id: professionalId, tenantId, active: true },
            select: { id: true, name: true, email: true, role: true, commissionRate: true, avatarUrl: true },
        });
        if (!professional) throw new AppError('Profissional não encontrado.', 404);
        return professional;
    }

    async update(tenantId: string, professionalId: string, data: UpdateProfessionalInput) {
        const professional = await prisma.professional.findFirst({ where: { id: professionalId, tenantId, active: true } });
        if (!professional) throw new AppError('Profissional não encontrado.', 404);

        if (data.role && data.role !== 'ADMIN' && professional.role === 'ADMIN') {
            const adminCount = await prisma.professional.count({ where: { tenantId, role: 'ADMIN', active: true } });
            if (adminCount <= 1) throw new AppError('Não é possível rebaixar o único administrador da barbearia.', 400);
        }

        return prisma.professional.update({
            where: { id: professionalId },
            data,
            select: { id: true, name: true, email: true, role: true, commissionRate: true, avatarUrl: true },
        });
    }

    async deactivate(tenantId: string, professionalId: string, requesterId: string) {
        const professional = await prisma.professional.findFirst({ where: { id: professionalId, tenantId, active: true } });
        if (!professional) throw new AppError('Profissional não encontrado.', 404);
        if (professionalId === requesterId) throw new AppError('Você não pode desativar sua própria conta.', 400);

        if (professional.role === 'ADMIN') {
            const adminCount = await prisma.professional.count({ where: { tenantId, role: 'ADMIN', active: true } });
            if (adminCount <= 1) throw new AppError('Não é possível desativar o único administrador da barbearia.', 400);
        }

        await prisma.appointment.updateMany({
            where: { tenantId, professionalId, status: 'PENDING', startTime: { gt: new Date() } },
            data: { status: 'CANCELED' },
        });

        return prisma.professional.update({ where: { id: professionalId }, data: { active: false }, select: { id: true, name: true, active: true } });
    }
}