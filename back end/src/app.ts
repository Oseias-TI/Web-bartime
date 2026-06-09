import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routes } from './routes';
import { errorHandler } from './shared/middlewares/errorHandler';
import { WebhookController } from './modules/billing/controllers/WebhookController';
import { traceIdMiddleware } from './shared/middlewares/traceIdMiddleware';
import { metricsMiddleware, metricsEndpoint } from './shared/middlewares/metricsMiddleware';
import { ensureAuthenticated } from './shared/middlewares/ensureAuthenticated';
import { ensureSuperAdmin } from './shared/middlewares/ensureSuperAdmin';

const app = express();

app.use(helmet());

const webhookController = new WebhookController();
app.post(
    '/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    (req, res) => webhookController.handle(req, res)
);

app.use(express.json());

import path from 'path';
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// BUG-02: Validar origens contra ALLOWED_ORIGINS ao invés de aceitar qualquer origem
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());
app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sem origin (ex: ferramentas, mobile, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origem não permitida pelo CORS.'));
        }
    },
    credentials: true,
}));

app.use(traceIdMiddleware);
app.use(metricsMiddleware);

// BUG-03: /metrics protegido — requer autenticação + super admin
app.get('/metrics', ensureAuthenticated, ensureSuperAdmin, metricsEndpoint);

app.use(routes);
app.use(errorHandler);

export { app };
