import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routes } from './routes';
import { errorHandler } from './shared/middlewares/errorHandler';
import { prisma } from './lib/prisma';
import { WebhookController } from './modules/billing/controllers/WebhookController';
import { startReminderJobs } from './shared/jobs/appointmentReminders';
import { startBackupJob } from './shared/jobs/databaseBackup';

const app = express();

// ── Middlewares de segurança — devem vir ANTES de qualquer rota ────────────
// BUG-21: helmet() movido para antes do webhook para cobrir todas as rotas
app.use(helmet());

// ── Webhook do Stripe — RAW BODY (deve vir ANTES do express.json) ──────────
const webhookController = new WebhookController();
app.post(
    '/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    (req, res) => webhookController.handle(req, res)
);
app.use(express.json());
// BUG-19: Restringir CORS a origens explicitamente permitidas via variável de ambiente
app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
}));
app.use(routes);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3333;

const server = app.listen(PORT, () => {
    console.log(`🚀 BarberFlow rodando na porta ${PORT}`);

    // Inicia os jobs em background
    startReminderJobs();
    startBackupJob();
});

const shutdown = async () => {
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);