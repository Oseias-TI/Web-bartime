import crypto from 'crypto';
import { prisma } from '../../../lib/prisma';
import { sendMail } from '../../../shared/utils/mailer';

const RESET_TOKEN_EXPIRES_MINUTES = 30;

export class ClientForgotPasswordService {
    async execute(email: string, slug: string) {
        // Find the tenant to ensure the client belongs to it
        const tenant = await prisma.tenant.findUnique({ where: { slug } });
        if (!tenant) return;

        // Find the client by email and tenant
        const client = await prisma.client.findFirst({
            where: { email, tenantId: tenant.id },
            include: { tenant: true }
        });
        
        if (!client || !client.email) return;

        await prisma.clientPasswordResetToken.updateMany({
            where: { clientId: client.id, used: false },
            data: { used: true },
        });

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRES_MINUTES);

        await prisma.clientPasswordResetToken.create({
            data: { token: hashedToken, clientId: client.id, expiresAt },
        });

        const resetUrl = `${process.env.APP_URL}/book/${client.tenant.slug}/reset-password?token=${rawToken}`;

        await sendMail({
            to: client.email,
            subject: 'Bartime — Redefinição de senha da Área do Cliente',
            html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2>Olá, ${client.name}!</h2>
          <p>Clique no botão para redefinir sua senha na barbearia ${client.tenant.name}. O link expira em <strong>${RESET_TOKEN_EXPIRES_MINUTES} minutos</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
            Redefinir senha
          </a>
          <p style="color:#6b7280;font-size:13px;margin-top:16px;">Se não foi você, ignore este e-mail.</p>
        </div>
      `,
        });
    }
}
