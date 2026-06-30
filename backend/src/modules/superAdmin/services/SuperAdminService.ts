import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { getPaginationParams, buildPaginatedResult } from '../../../shared/utils/paginate';
import { SubscriptionStatus } from '@prisma/client';

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

        const formattedData = data.map(t => ({
            id: t.id,
            name: t.name,
            cnpj: t.cnpj,
            subscriptionStatus: t.subscriptionStatus,
            currentPeriodEnd: t.currentPeriodEnd,
            trialEndsAt: t.trialEndsAt,
            createdAt: t.createdAt,
            professionalsCount: t._count.professionals,
            clientsCount: t._count.clients,
            appointmentsCount: t._count.appointments,
        }));

        return buildPaginatedResult(formattedData, total, params);
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

    async getPlatformStats(filter: string = 'Mensal') {
        const now = new Date();
        let startOfPeriod = new Date();
        let pointsToGenerate = 7;
        let daysPerPoint = 1;

        if (filter === 'Diário') {
            startOfPeriod.setDate(now.getDate() - 1);
            pointsToGenerate = 24;
        } else if (filter === 'Semanal') {
            startOfPeriod.setDate(now.getDate() - 7);
            pointsToGenerate = 7;
            daysPerPoint = 1;
        } else if (filter === 'Mensal') {
            startOfPeriod.setDate(now.getDate() - 30);
            pointsToGenerate = 15;
            daysPerPoint = 2;
        } else if (filter === 'Anual') {
            startOfPeriod.setDate(now.getDate() - 365);
            pointsToGenerate = 12;
            daysPerPoint = 30;
        }

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
            totalProfessionals,
            totalClients,
        ] = await Promise.all([
            prisma.tenant.count(),
            prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE' } }),
            prisma.tenant.count({ where: { subscriptionStatus: 'TRIAL' } }),
            prisma.tenant.count({ where: { subscriptionStatus: 'PAST_DUE' } }),
            prisma.tenant.count({ where: { subscriptionStatus: 'CANCELED' } }),
            prisma.transaction.aggregate({ _sum: { amount: true } }),
            prisma.transaction.aggregate({ where: { createdAt: { gte: startOfPeriod } }, _sum: { amount: true } }),
            prisma.tenant.count({ where: { createdAt: { gte: startOfPeriod } } }),
            prisma.appointment.count({ where: { status: 'COMPLETED', startTime: { gte: startOfPeriod } } }),
            prisma.professional.count(),
            prisma.client.count(),
        ]);

        const historicalPoints = Array.from({ length: pointsToGenerate }).map((_, i) => {
            const d = new Date();
            if (filter === 'Diário') {
                d.setHours(d.getHours() - (pointsToGenerate - 1 - i));
                d.setMinutes(0, 0, 0);
            } else {
                d.setDate(d.getDate() - ((pointsToGenerate - 1 - i) * daysPerPoint));
                d.setHours(0, 0, 0, 0);
            }
            return d;
        });

        const recentTenants = await prisma.tenant.findMany({
            where: { createdAt: { gte: historicalPoints[0] } },
            select: { createdAt: true }
        });

        const recentAppointments = await prisma.appointment.findMany({
            where: { startTime: { gte: historicalPoints[0] }, status: 'COMPLETED' },
            select: { startTime: true }
        });

        const recentTransactions = await prisma.transaction.findMany({
            where: { createdAt: { gte: historicalPoints[0] } },
            select: { createdAt: true, amount: true }
        });

        const topTenantsAggr = await prisma.transaction.groupBy({
            by: ['tenantId'],
            where: { createdAt: { gte: startOfPeriod } },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 5
        });

        const topTenantsData = await Promise.all(topTenantsAggr.map(async (t) => {
            const tenant = await prisma.tenant.findUnique({ where: { id: t.tenantId }, select: { name: true, cnpj: true } });
            return {
                id: t.tenantId,
                name: tenant?.name || 'Desconhecido',
                cnpj: tenant?.cnpj || '',
                totalAmount: Number(t._sum.amount ?? 0)
            };
        }));

        const chartData = historicalPoints.map(pointDate => {
            const nextPoint = new Date(pointDate);
            if (filter === 'Diário') {
                nextPoint.setHours(nextPoint.getHours() + 1);
            } else {
                nextPoint.setDate(nextPoint.getDate() + daysPerPoint);
            }
            
            const tenantsCount = recentTenants.filter(t => t.createdAt >= pointDate && t.createdAt < nextPoint).length;
            const apptsCount = recentAppointments.filter(a => a.startTime >= pointDate && a.startTime < nextPoint).length;
            const periodTransactions = recentTransactions.filter(t => t.createdAt >= pointDate && t.createdAt < nextPoint);
            const periodGmv = periodTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

            let label = '';
            if (filter === 'Diário') {
                label = `${pointDate.getHours().toString().padStart(2, '0')}:00`;
            } else if (filter === 'Anual') {
                label = pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            } else {
                label = `${pointDate.getDate().toString().padStart(2, '0')}/${(pointDate.getMonth() + 1).toString().padStart(2, '0')}`;
            }

            return {
                name: label,
                novasBarbearias: tenantsCount,
                agendamentos: apptsCount,
                gmv: periodGmv
            };
        });

        const mrr = activeTenants * 99.90;

        return {
            tenants: { total: totalTenants, active: activeTenants, trial: trialTenants, pastDue: pastDueTenants, canceled: canceledTenants },
            revenue: { total: Number(totalRevenue._sum.amount ?? 0).toFixed(2), thisMonth: Number(monthlyRevenue._sum.amount ?? 0).toFixed(2), mrr: mrr.toFixed(2) },
            newTenantsThisMonth,
            totalAppointments,
            totalProfessionals,
            totalClients,
            chartData,
            topTenants: topTenantsData
        };
    }

    async updateTenantStatus(tenantId: string, status: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        const validStatuses = Object.values(SubscriptionStatus);
        if (!validStatuses.includes(status as SubscriptionStatus)) throw new AppError('Status inválido.', 400);

        return prisma.tenant.update({
            where: { id: tenantId },
            data: { subscriptionStatus: status as SubscriptionStatus },
            select: { id: true, name: true, subscriptionStatus: true },
        });
    }

    async createTenant(data: { name: string; cnpj: string; slug: string }) {
        if (!data.name || !data.cnpj || !data.slug) {
            throw new AppError('Nome, CNPJ e Slug são obrigatórios.', 400);
        }

        const existingCnpj = await prisma.tenant.findUnique({ where: { cnpj: data.cnpj } });
        if (existingCnpj) throw new AppError('CNPJ já está em uso.', 400);

        const existingSlug = await prisma.tenant.findUnique({ where: { slug: data.slug } });
        if (existingSlug) throw new AppError('Slug já está em uso.', 400);

        return prisma.tenant.create({
            data: {
                name: data.name,
                cnpj: data.cnpj,
                slug: data.slug,
                subscriptionStatus: 'TRIAL',
            },
        });
    }

    async updateTenant(tenantId: string, data: { name?: string; cnpj?: string; slug?: string }) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);

        if (data.cnpj && data.cnpj !== tenant.cnpj) {
            const existingCnpj = await prisma.tenant.findUnique({ where: { cnpj: data.cnpj } });
            if (existingCnpj) throw new AppError('CNPJ já está em uso.', 400);
        }

        if (data.slug && data.slug !== tenant.slug) {
            const existingSlug = await prisma.tenant.findUnique({ where: { slug: data.slug } });
            if (existingSlug) throw new AppError('Slug já está em uso.', 400);
        }

        return prisma.tenant.update({
            where: { id: tenantId },
            data,
        });
    }

    async deleteTenant(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new AppError('Barbearia não encontrada.', 404);
        if (tenant.cnpj === '00000000000000' || tenant.slug.startsWith('admin-bartime')) {
            throw new AppError('Não é possível excluir a Barbearia/Tenant do Sistema Principal.', 403);
        }

        await prisma.$transaction(async (tx) => {
            await tx.refreshToken.deleteMany({ where: { professional: { tenantId } } });
            await tx.clientPasswordResetToken.deleteMany({ where: { client: { tenantId } } });
            await tx.appointmentReminder.deleteMany({ where: { appointment: { tenantId } } });
            await tx.commission.deleteMany({ where: { tenantId } });
            await tx.transaction.deleteMany({ where: { tenantId } });

            await tx.appointment.deleteMany({ where: { tenantId } });

            await tx.businessHour.deleteMany({ where: { tenantId } });
            await tx.auditLog.deleteMany({ where: { tenantId } });
            await tx.client.deleteMany({ where: { tenantId } });
            await tx.service.deleteMany({ where: { tenantId } });
            await tx.professional.deleteMany({ where: { tenantId } });

            await tx.tenant.delete({ where: { id: tenantId } });
        });

        return { message: 'Barbearia excluída definitivamente com sucesso.' };
    }

    async listUsers(paginationQuery: Record<string, any>, search?: string) {
        const params = getPaginationParams(paginationQuery);
        const where = search
            ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
            : {};

        const [data, total] = await Promise.all([
            prisma.professional.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: params.skip,
                take: params.limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    active: true,
                    avatarUrl: true,
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                },
            }),
            prisma.professional.count({ where }),
        ]);

        return buildPaginatedResult(data, total, params);
    }

    async updateUserStatus(professionalId: string, active: boolean) {
        const professional = await prisma.professional.findUnique({ where: { id: professionalId } });
        if (!professional) throw new AppError('Usuário não encontrado.', 404);
        if (professional.role === 'SUPER_ADMIN') throw new AppError('Não é possível desativar um Super Admin.', 403);

        const updated = await prisma.professional.update({
            where: { id: professionalId },
            data: { active },
            select: { id: true, name: true, active: true }
        });

        if (!active) {
            await prisma.refreshToken.deleteMany({ where: { professionalId } });
        }

        return { message: active ? 'Acesso liberado.' : 'Acesso bloqueado.', user: updated };
    }

    async updateUserPassword(professionalId: string, newPassword: string) {
        const professional = await prisma.professional.findUnique({ where: { id: professionalId } });
        if (!professional) throw new AppError('Usuário não encontrado.', 404);

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updated = await prisma.professional.update({
            where: { id: professionalId },
            data: { password: hashedPassword },
            select: { id: true, name: true, email: true }
        });

        await prisma.refreshToken.deleteMany({ where: { professionalId } });

        return { message: 'Senha alterada com sucesso.', user: updated };
    }
    async updateUserEmail(professionalId: string, newEmail: string) {
        if (!newEmail || !newEmail.includes('@')) {
            throw new AppError('E-mail inválido.', 400);
        }

        const professional = await prisma.professional.findUnique({ where: { id: professionalId } });
        if (!professional) throw new AppError('Usuário não encontrado.', 404);

        if (professional.email === newEmail) {
            throw new AppError('O novo e-mail é igual ao atual.', 400);
        }

        const emailExists = await prisma.professional.findFirst({ where: { email: newEmail } });
        if (emailExists) {
            throw new AppError('Este e-mail já está em uso por outro usuário.', 400);
        }

        const updated = await prisma.professional.update({
            where: { id: professionalId },
            data: { email: newEmail },
            select: { id: true, name: true, email: true }
        });

        await prisma.refreshToken.deleteMany({ where: { professionalId } });

        return { message: 'E-mail alterado com sucesso.', user: updated };
    }
}