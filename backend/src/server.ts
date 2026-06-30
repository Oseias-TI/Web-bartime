import { app } from './app';
import { prisma } from './lib/prisma';
import { startReminderJobs } from './shared/jobs/appointmentReminders';
import { startBackupJob } from './shared/jobs/databaseBackup';
import { startLgpdCleanupJob } from './shared/jobs/lgpdCleanup';
import { connectRedis } from './lib/redis';

const PORT = Number(process.env.PORT) || 3333;

const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Bartime rodando na porta ${PORT}`);

    await connectRedis();

    startReminderJobs();
    startBackupJob();
    startLgpdCleanupJob();
});

const shutdown = async () => {
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);