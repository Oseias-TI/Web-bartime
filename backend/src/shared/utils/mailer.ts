import nodemailer from 'nodemailer';
import dns from 'node:dns';

// Força o Node a resolver domínios preferencialmente em IPv4
// Isso corrige o erro ENETUNREACH ao tentar enviar emails via SMTP do Gmail e outros no Railway
dns.setDefaultResultOrder('ipv4first');

// BUG-10: Validar variáveis SMTP no carregamento do módulo para falhar rapidamente
const REQUIRED_SMTP_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] as const;
for (const envVar of REQUIRED_SMTP_VARS) {
    if (!process.env[envVar]) {
        console.warn(`[Mailer] ATENÇÃO: Variável de ambiente ${envVar} não definida. O envio de e-mails falhará.`);
    }
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
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