import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export const traceIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const headerTraceId = req.headers['x-trace-id'];
  const traceId: string = Array.isArray(headerTraceId) ? headerTraceId[0] : headerTraceId || uuidv4();
  req.headers['x-trace-id'] = traceId;
  
  // Attach traceId to locals for convenience
  res.locals.traceId = traceId;

  const childLogger = logger.child({ traceId });
  // Store logger in request object
  (req as any).logger = childLogger;

  childLogger.info(`Incoming Request: ${req.method} ${req.url}`, {
    body: req.body,
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
