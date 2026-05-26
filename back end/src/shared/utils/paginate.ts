export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export function getPaginationParams(query: Record<string, any>): PaginationParams {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

export function buildPaginatedResult<T>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginatedResult<T> {
    const totalPages = Math.ceil(total / params.limit);
    return {
        data,
        pagination: {
            total,
            page: params.page,
            limit: params.limit,
            totalPages,
            hasNext: params.page < totalPages,
            hasPrev: params.page > 1,
        },
    };
}