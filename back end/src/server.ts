import { app } from './app';
import { prisma } from './lib/prisma';
import { startReminderJobs } from './shared/jobs/appointmentReminders';
import { startBackupJob } from './shared/jobs/databaseBackup';
import { connectRedis } from './lib/redis';

const PORT = Number(process.env.PORT) || 3333;

const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 BarberFlow rodando na porta ${PORT}`);

    // Conecta ao Redis
    await connectRedis();

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