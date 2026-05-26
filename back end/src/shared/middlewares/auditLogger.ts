import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

interface AuditOptions {
    action: string;
    entity: string;
    getEntityId?: (req: Request) => string | undefined;
    getMetadata?: (req: Request, res: Response) => Record<string, any> | undefined;
}

// BUG-16: Sanitizar campos sensíveis do body antes de salvar no AuditLog
const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'confirmPassword', 'token', 'refreshToken'];

function sanitizeBody(body: Record<string, any>): Record<string, any> {
    const sanitized = { ...body };
    for (const field of SENSITIVE_FIELDS) {
        if (field in sanitized) sanitized[field] = '[REDACTED]';
    }
    return sanitized;
}

export function auditLog(options: AuditOptions) {
    return (req: Request, res: Response, next: NextFunction) => {
        const originalJson = res.json.bind(res);

        // Intercepta o json() para capturar o entityId da resposta
        res.json = function (body: any) {
            const entityId = options.getEntityId
                ? options.getEntityId(req)
                : (body?.id ?? req.params.id ?? undefined);

            const metadata = options.getMetadata
                ? options.getMetadata(req, res)
                : { body: sanitizeBody(req.body) };

            // Registra só se a requisição foi bem-sucedida
            if (res.statusCode < 400) {
                prisma.auditLog.create({
                    data: {
                        tenantId: req.user?.tenantId ?? null,
                        professionalId: req.user?.id ?? null,
                        action: options.action,
                        entity: options.entity,
                        entityId: entityId ? String(entityId) : null,
                        metadata: metadata ?? undefined,
                        ipAddress: req.ip,
                    },
                }).catch((err: any) => console.error('[AuditLog] Erro ao registrar:', err));
            }

            return originalJson(body);
        };

        next();
    };
}