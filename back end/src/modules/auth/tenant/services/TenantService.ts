import { prisma } from '../../../../lib/prisma';
import { AppError } from '../../../../shared/errors/AppError';
import { UpdateTenantInput } from '../dtos/UpdateTenantSchema';

export class TenantService {
    async get(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                cnpj: true,
                slug: true,
                logoUrl: true,
                subscriptionStatus: true,
                currentPeriodEnd: true,
                trialEndsAt: true,
                createdAt: true,
            },
        });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);
        return tenant;
    }

    async update(tenantId: string, data: UpdateTenantInput) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        return prisma.tenant.update({
            where: { id: tenantId },
            data,
            select: {
                id: true,
                name: true,
                cnpj: true,
                slug: true,
                logoUrl: true,
                subscriptionStatus: true,
            },
        });
    }

    async updateLogo(tenantId: string, logoUrl: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        return prisma.tenant.update({
            where: { id: tenantId },
            data: { logoUrl },
            select: { id: true, name: true, slug: true, logoUrl: true },
        });
    }
}