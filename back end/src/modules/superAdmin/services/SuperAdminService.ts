import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { getPaginationParams, buildPaginatedResult } from '../../../shared/utils/paginate';

export class SuperAdminService {
    async listTenants(paginationQuery: Record<string, any>, search?: string) {
        const params = getPaginationParams(paginationQuery);
        const where = search
            ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { cnpj: { contains: search } }] }
            : {};

        const [data, total] = await Promise.all([
            prisma.tenant.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: params.skip,
                take: params.limit,
                select: {
                    id: true,
                    name: true,
                    cnpj: true,
                    subscriptionStatus: true,
                    currentPeriodEnd: true,
                    trialEndsAt: true,
                    createdAt: true,
                    _count: {
                        select: {
                            professionals: true,
                            clients: true,
                            appointments: true,
                        },
                    },
                },
            }),
            prisma.tenant.count({ where }),
        ]);

        return buildPaginatedResult(data, total, params);
    }

    async getTenantDetails(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                professionals: {
                    where: { active: true },
                    select: { id: true, name: true, email: true, role: true },
                },
                _count: {
                    select: {
                        clients: true,
                        appointments: true,
                        transactions: true,
                    },
                },
            },
        });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        const revenue = await prisma.transaction.aggregate({
            where: { tenantId, type: 'INCOME' },
            _sum: { amount: true },
        });

        return {
            ...tenant,
            totalRevenue: Number(revenue._sum.amount ?? 0).toFixed(2),
        };
    }

    async getPlatformStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalTenants,
            activeTenants,
            trialTenants,
            pastDueTenants,
            canceledTenants,
            totalRevenue,
            monthlyRevenue,
            newTenantsThisMonth,
            totalAppointments,
        ] = await Promise.all([
            prisma.tenant.count(),
            prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE' } }),
            prisma.tenant.count({ where: { subscriptionStatus: 'TRIAL' } }),
            prisma.tenant.count({ where: { subscriptionStatus: 'PAST_DUE' } }),
            prisma.tenant.count({ where: { subscriptionStatus: 'CANCELED' } }),
            prisma.transaction.aggregate({ _sum: { amount: true } }),
            prisma.transaction.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
            prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.appointment.count({ where: { status: 'COMPLETED' } }),
        ]);

        return {
            tenants: { total: totalTenants, active: activeTenants, trial: trialTenants, pastDue: pastDueTenants, canceled: canceledTenants },
            revenue: { total: Number(totalRevenue._sum.amount ?? 0).toFixed(2), thisMonth: Number(monthlyRevenue._sum.amount ?? 0).toFixed(2) },
            newTenantsThisMonth,
            totalAppointments,
        };
    }

    async updateTenantStatus(tenantId: string, status: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        const validStatuses = ['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED', 'UNPAID'];
        if (!validStatuses.includes(status)) throw new AppError('Status inválido.', 400);

        return prisma.tenant.update({
            where: { id: tenantId },
            data: { subscriptionStatus: status },
            select: { id: true, name: true, subscriptionStatus: true },
        });
    }
}