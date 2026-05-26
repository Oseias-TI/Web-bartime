import { prisma } from '../../../lib/prisma';
import { getPaginationParams, buildPaginatedResult, PaginationParams } from '../../../shared/utils/paginate';

export class AuditService {
    async list(tenantId: string, paginationQuery: Record<string, any>) {
        const params = getPaginationParams(paginationQuery);
        const where = { tenantId };

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: params.skip,
                take: params.limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return buildPaginatedResult(data, total, params);
    }
}