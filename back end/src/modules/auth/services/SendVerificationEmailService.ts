import crypto from 'crypto';
import { prisma } from '../../../lib/prisma';
import { sendMail } from '../../../shared/utils/mailer';

const VERIFICATION_TOKEN_EXPIRES_HOURS = 24;

export class SendVerificationEmailService {
    async execute(professionalId: string) {
        const professional = await prisma.professional.findUnique({
            where: { id: professionalId },
            select: { email: true, name: true, emailVerified: true },
        });

        if (!professional) return;
        if (professional.emailVerified) return; // já verificado

        // Invalida tokens anteriores
        await prisma.emailVerificationToken.deleteMany({ where: { professionalId } });

        const rawToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_EXPIRES_HOURS);

        await prisma.emailVerificationToken.create({
            data: { token: rawToken, professionalId, expiresAt },
        });

        const verifyUrl = `${process.env.APP_URL}/verify-email?token=${rawToken}`;

        await sendMail({
            to: professional.email,
            subject: 'BarberFlow — Confirme seu e-mail',
            html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2>Olá, ${professional.name}!</h2>
          <p>Clique no botão abaixo para confirmar seu e-mail. O link expira em <strong>${VERIFICATION_TOKEN_EXPIRES_HOURS} horas</strong>.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;
                    border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Confirmar e-mail
          </a>
          <p style="color:#6b7280;font-size:13px;">Se não foi você, ignore este e-mail.</p>
          <p style="color:#6b7280;font-size:13px;">
            Ou copie e cole no navegador:<br/>
            <a href="${verifyUrl}">${verifyUrl}</a>
          </p>
        </div>
      `,
        });
    }
}