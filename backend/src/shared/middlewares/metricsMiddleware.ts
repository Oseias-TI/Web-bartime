import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

client.collectDefaultMetrics({ prefix: 'bartime_' });

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'bartime_http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000, 2000, 5000]
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = (diff[0] * 1e3) + (diff[1] * 1e-6);
    
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
  });

  next();
};

export const metricsEndpoint = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
};
