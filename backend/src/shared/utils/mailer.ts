import nodemailer from 'nodemailer';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const REQUIRED_SMTP_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] as const;
for (const envVar of REQUIRED_SMTP_VARS) {
    if (!process.env[envVar]) {
        console.warn(`[Mailer] ATENÇÃO: Variável de ambiente ${envVar} não definida. O envio de e-mails falhará.`);
    }
}

const port = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'Bartime <noreply@bartime.com>',
        to,
        subject,
        html,
    });
}