import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

export class ClientResetPasswordService {
    async execute(token: string, newPassword: string) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetToken = await prisma.clientPasswordResetToken.findUnique({
            where: { token: hashedToken },
            include: { client: true },
        });

        if (!resetToken) {
            throw new AppError('Token inválido ou expirado', 400);
        }

        if (resetToken.used) {
            throw new AppError('Este token já foi utilizado', 400);
        }

        if (new Date() > resetToken.expiresAt) {
            throw new AppError('Token expirado', 400);
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await prisma.$transaction([
            prisma.client.update({
                where: { id: resetToken.clientId },
                data: { password: newPasswordHash },
            }),
            prisma.clientPasswordResetToken.update({
                where: { id: resetToken.id },
                data: { used: true },
            }),
        ]);
    }
}
