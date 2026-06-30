import cron from 'node-cron';
import { prisma } from '../../lib/prisma';
import { sendMail } from '../utils/mailer';
import { ReminderType } from '@prisma/client';

async function sendReminder(hoursBeforeLabel: ReminderType, hoursBeforeMs: number) {
    const now = new Date();
    const windowStart = new Date(now.getTime() + hoursBeforeMs);
    const windowEnd = new Date(windowStart.getTime() + 5 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
        where: {
            status: 'PENDING',
            startTime: { gte: windowStart, lte: windowEnd },
            reminders: { none: { type: hoursBeforeLabel } },
        },
        include: {
            client: true,
            professional: true,
            service: true,
        },
    });

    for (const appointment of appointments) {
        if (!appointment.client.email) continue;

        const startTime = new Date(appointment.startTime);
        const dateStr = startTime.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long', day: '2-digit', month: 'long' });
        const timeStr = startTime.toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });

        try {
            await sendMail({
                to: appointment.client.email,
                subject: `Bartime — Lembrete: seu agendamento é ${hoursBeforeLabel === ReminderType.EMAIL_24H ? 'amanhã' : 'em 1 hora'}`,
                html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2>Olá, ${appointment.client.name}!</h2>
            <p>Este é um lembrete do seu agendamento:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;color:#6b7280;">Serviço</td><td style="padding:8px;font-weight:bold;">${appointment.service.name}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Profissional</td><td style="padding:8px;font-weight:bold;">${appointment.professional.name}</td></tr>
              <tr><td style="padding:8px;color:#6b7280;">Data</td><td style="padding:8px;font-weight:bold;">${dateStr}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Horário</td><td style="padding:8px;font-weight:bold;">${timeStr}</td></tr>
            </table>
            <p style="color:#6b7280;font-size:13px;">Se precisar cancelar ou remarcar, entre em contato com a barbearia.</p>
          </div>
        `,
            });

            await prisma.appointmentReminder.create({
                data: { appointmentId: appointment.id, type: hoursBeforeLabel },
            });

            console.log(`[Reminder] ${hoursBeforeLabel} enviado para ${appointment.client.email} — agendamento ${appointment.id}`);
        } catch (err) {
            console.error(`[Reminder] Erro ao enviar para ${appointment.client.email}:`, err);
        }
    }
}

export function startReminderJobs() {
    cron.schedule('*/5 * * * *', () => {
        sendReminder(ReminderType.EMAIL_24H, 24 * 60 * 60 * 1000).catch(console.error);
    });

    cron.schedule('*/5 * * * *', () => {
        sendReminder(ReminderType.EMAIL_1H, 60 * 60 * 1000).catch(console.error);
    });

    console.log('[Jobs] Lembretes de agendamento iniciados.');
}