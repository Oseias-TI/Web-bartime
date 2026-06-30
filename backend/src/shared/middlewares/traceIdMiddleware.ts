import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'confirmPassword', 'token', 'refreshToken'];

function sanitizeForLog(body: Record<string, any>): Record<string, any> {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body };
    for (const field of SENSITIVE_FIELDS) {
        if (field in sanitized) sanitized[field] = '[REDACTED]';
    }
    return sanitized;
}

export const traceIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const headerTraceId = req.headers['x-trace-id'];
  const traceId: string = Array.isArray(headerTraceId) ? headerTraceId[0] : headerTraceId || uuidv4();
  req.headers['x-trace-id'] = traceId;
  
  res.locals.traceId = traceId;

  const childLogger = logger.child({ traceId });
  (req as any).logger = childLogger;

  childLogger.info(`Incoming Request: ${req.method} ${req.url}`, {
    body: sanitizeForLog(req.body),
    query: req.query,
    params: req.params,
    ip: req.ip
  });

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    childLogger.info(`Outgoing Response: ${req.method} ${req.url}`, {
      statusCode: res.statusCode,
      durationMs: duration
    });
  });

  next();
};
