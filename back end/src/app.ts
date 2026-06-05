import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routes } from './routes';
import { errorHandler } from './shared/middlewares/errorHandler';
import { WebhookController } from './modules/billing/controllers/WebhookController';
import { traceIdMiddleware } from './shared/middlewares/traceIdMiddleware';
import { metricsMiddleware, metricsEndpoint } from './shared/middlewares/metricsMiddleware';

const app = express();

app.use(helmet());

const webhookController = new WebhookController();
app.post(
    '/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    (req, res) => webhookController.handle(req, res)
);

app.use(express.json());
app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
}));

app.use(traceIdMiddleware);
app.use(metricsMiddleware);
app.get('/metrics', metricsEndpoint);

app.use(routes);
app.use(errorHandler);

export { app };
