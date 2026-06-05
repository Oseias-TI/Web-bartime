import { prisma } from '../../../lib/prisma';
import { redisClient } from '../../../lib/redis';
import { AppError } from '../../../shared/errors/AppError';
import { UpdateClientInput } from '../dtos/UpdateClientSchema';
import { getPaginationParams, buildPaginatedResult } from '../../../shared/utils/paginate';

interface CreateClientData {
    name: string;
    phone: string;
    preferences?: string;
    tenantId: string;
}

const POINTS_PER_REWARD = 10;

export class ClientService {
    async createClient(data: CreateClientData) {
        const exists = await prisma.client.findUnique({
            where: { tenantId_phone: { tenantId: data.tenantId, phone: data.phone } },
        });
        if (exists) throw new AppError('Telefone já cadastrado para outro cliente.', 409);
        
        const client = await prisma.client.create({ data });
        // Invalidate cache
        await redisClient.del(`clients:list:${data.tenantId}`);
        return client;
    }

    async listAll(tenantId: string, search?: string, paginationQuery: Record<string, any> = {}) {
        const params = getPaginationParams(paginationQuery);
        const cacheKey = `clients:list:${tenantId}:${search || 'all'}:${params.page}:${params.limit}`;

        if (redisClient.isReady) {
            const cached = await redisClient.get(cacheKey);
            if (cached) return JSON.parse(cached);
        }

        const where = {
            tenantId,
            ...(search
                ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }] }
                : {}),
        };

        const [data, total] = await Promise.all([
            prisma.client.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: params.skip,
                take: params.limit,
                select: { id: true, name: true, phone: true, email: true, loyaltyPoints: true, createdAt: true },
            }),
            prisma.client.count({ where }),
        ]);

        const result = buildPaginatedResult(data, total, params);
        
        if (redisClient.isReady) {
            await redisClient.setEx(cacheKey, 60 * 5, JSON.stringify(result)); // Cache for 5 minutes
        }

        return result;
    }

    async getClientProfile(tenantId: string, clientId: string) {
        const client = await prisma.client.findFirst({
            where: { id: clientId, tenantId },
            include: {
                appointments: {
                    where: { status: 'COMPLETED' },
                    include: { service: true, professional: { select: { id: true, name: true } } },
                    orderBy: { startTime: 'desc' },
                },
            },
        });
        if (!client) throw new AppError('Cliente não encontrado.', 404);
        return client;
    }

    async getClientSpending(tenantId: string, clientId: string) {
        // BUG-18: Incluir loyaltyPoints para calcular corretamente pointsToNextReward
        const client = await prisma.client.findFirst({ where: { id: clientId, tenantId }, select: { id: true, name: true, loyaltyPoints: true } });
        if (!client) throw new AppError('Cliente não encontrado.', 404);

        const completed = await prisma.appointment.findMany({
            where: { tenantId, clientId, status: 'COMPLETED' },
            include: { service: { select: { price: true, name: true } } },
            orderBy: { startTime: 'desc' },
        });

        const totalSpent = completed.reduce((acc, a) => acc + Number(a.service.price), 0);
        const avgTicket = completed.length > 0 ? totalSpent / completed.length : 0;

        return {
            client,
            totalVisits: completed.length,
            totalSpent: totalSpent.toFixed(2),
            avgTicket: avgTicket.toFixed(2),
            lastVisit: completed[0]?.startTime ?? null,
            // BUG-18: Calcular pontos faltando para a próxima recompensa com base nos pontos atuais
            pointsToNextReward: POINTS_PER_REWARD - (client.loyaltyPoints % POINTS_PER_REWARD),
        };
    }

    async getInactiveClients(tenantId: string, inactiveDays: number = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

        const recentIds = await prisma.appointment.findMany({
            where: { tenantId, status: { not: 'CANCELED' }, startTime: { gte: cutoffDate } },
            select: { clientId: true },
            distinct: ['clientId'],
        });

        const inactive = await prisma.client.findMany({
            where: {
                tenantId,
                id: { notIn: recentIds.map(a => a.clientId) },
                // BUG-14: Adicionar tenantId no filtro aninhado para garantir isolamento por tenant
                appointments: { some: { status: 'COMPLETED', tenantId } },
            },
            select: {
                id: true, name: true, phone: true, loyaltyPoints: true,
                appointments: {
                    where: { status: 'COMPLETED' },
                    orderBy: { startTime: 'desc' },
                    take: 1,
                    select: { startTime: true, service: { select: { name: true } } },
                },
            },
            orderBy: { name: 'asc' },
        });

        return inactive.map(client => {
            const lastVisit = client.appointments[0]?.startTime ?? null;
            const daysSinceLastVisit = lastVisit
                ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86_400_000)
                : null;
            return {
                id: client.id, name: client.name, phone: client.phone,
                loyaltyPoints: client.loyaltyPoints, lastVisit, daysSinceLastVisit,
                lastService: client.appointments[0]?.service?.name ?? null,
            };
        });
    }

    async updateClient(tenantId: string, clientId: string, data: UpdateClientInput) {
        const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client) throw new AppError('Cliente não encontrado.', 404);

        if (data.phone && data.phone !== client.phone) {
            const conflict = await prisma.client.findUnique({ where: { tenantId_phone: { tenantId, phone: data.phone } } });
            if (conflict) throw new AppError('Este telefone já pertence a outro cliente.', 409);
        }

        const updated = await prisma.client.update({ where: { id: clientId }, data });
        
        // Invalidate list cache and possibly profile cache if implemented
        if (redisClient.isReady) {
            const keys = await redisClient.keys(`clients:list:${tenantId}*`);
            if (keys.length > 0) await redisClient.del(keys);
        }

        return updated;
    }

    async redeemPoints(tenantId: string, clientId: string, points: number) {
        const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client) throw new AppError('Cliente não encontrado.', 404);
        if (points > client.loyaltyPoints) throw new AppError(`Pontos insuficientes. Cliente possui ${client.loyaltyPoints} ponto(s).`, 400);
        if (points < POINTS_PER_REWARD) throw new AppError(`São necessários ${POINTS_PER_REWARD} pontos para resgatar um benefício.`, 400);

        const updated = await prisma.client.update({ where: { id: clientId }, data: { loyaltyPoints: { decrement: points } } });
        const rewards = Math.floor(points / POINTS_PER_REWARD);

        return { message: `${rewards} benefício(s) resgatado(s) com sucesso!`, pointsUsed: points, pointsRemaining: updated.loyaltyPoints, rewards };
    }
}