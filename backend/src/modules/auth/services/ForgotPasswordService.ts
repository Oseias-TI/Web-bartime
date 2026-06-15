import crypto from 'crypto';
import { prisma } from '../../../lib/prisma';
import { sendMail } from '../../../shared/utils/mailer';

const RESET_TOKEN_EXPIRES_MINUTES = 30;

export class ForgotPasswordService {
    async execute(email: string) {
        const professional = await prisma.professional.findFirst({ where: { email, active: true } });
        if (!professional) return;

        await prisma.passwordResetToken.updateMany({
            where: { professionalId: professional.id, used: false },
            data: { used: true },
        });

        const rawToken = crypto.randomBytes(32).toString('hex');
        // BUG-16: Hashear o token antes de salvar no banco
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRES_MINUTES);

        await prisma.passwordResetToken.create({
            data: { token: hashedToken, professionalId: professional.id, expiresAt },
        });

        // O rawToken (não hasheado) é enviado por e-mail
        const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}`;

        await sendMail({
            to: professional.email,
            subject: 'Bartime — Redefinição de senha',
            html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2>Olá, ${professional.name}!</h2>
          <p>Clique no botão para redefinir sua senha. O link expira em <strong>${RESET_TOKEN_EXPIRES_MINUTES} minutos</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
            Redefinir senha
          </a>
          <p style="color:#6b7280;font-size:13px;margin-top:16px;">Se não foi você, ignore este e-mail.</p>
        </div>
      `,
        });
    }
}