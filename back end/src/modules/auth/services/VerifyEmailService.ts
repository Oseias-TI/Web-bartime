import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

export class VerifyEmailService {
    async execute(token: string) {
        const verificationToken = await prisma.emailVerificationToken.findUnique({
            where: { token },
            include: { professional: true },
        });

        if (!verificationToken) throw new AppError('Token de verificação inválido.', 400);

        if (new Date() > verificationToken.expiresAt) {
            await prisma.emailVerificationToken.delete({ where: { token } });
            throw new AppError('Token de verificação expirado. Solicite um novo.', 400);
        }

        if (verificationToken.professional.emailVerified) {
            return { message: 'E-mail já verificado anteriormente.' };
        }

        await prisma.$transaction(async tx => {
            await tx.professional.update({
                where: { id: verificationToken.professionalId },
                data: { emailVerified: true },
            });
            await tx.emailVerificationToken.delete({ where: { token } });
        });

        return { message: 'E-mail verificado com sucesso!' };
    }
}