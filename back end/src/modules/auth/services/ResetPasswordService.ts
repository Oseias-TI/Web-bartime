import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

export class ResetPasswordService {
    async execute(token: string, newPassword: string) {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { professional: true },
        });

        if (!resetToken || resetToken.used) throw new AppError('Token inválido ou já utilizado.', 400);
        if (new Date() > resetToken.expiresAt) throw new AppError('Token expirado. Solicite uma nova redefinição.', 400);

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.$transaction(async tx => {
            await tx.professional.update({ where: { id: resetToken.professionalId }, data: { password: passwordHash } });
            await tx.passwordResetToken.update({ where: { token }, data: { used: true } });
            await tx.refreshToken.deleteMany({ where: { professionalId: resetToken.professionalId } });
        });

        return { message: 'Senha redefinida com sucesso. Faça login com a nova senha.' };
    }
}