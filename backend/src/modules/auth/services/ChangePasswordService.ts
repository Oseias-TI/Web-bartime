import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

interface ChangePasswordInput {
    professionalId: string;
    currentPassword: string;
    newPassword: string;
}

export class ChangePasswordService {
    async execute({ professionalId, currentPassword, newPassword }: ChangePasswordInput) {
        const professional = await prisma.professional.findUnique({
            where: { id: professionalId },
            select: { password: true },
        });

        if (!professional) throw new AppError('Profissional não encontrado.', 404);

        const passwordMatch = await bcrypt.compare(currentPassword, professional.password);
        if (!passwordMatch) throw new AppError('Senha atual incorreta.', 401);

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await prisma.$transaction(async tx => {
            await tx.professional.update({
                where: { id: professionalId },
                data: { password: newPasswordHash },
            });
            await tx.refreshToken.deleteMany({ where: { professionalId } });
        });

        return { message: 'Senha alterada com sucesso. Faça login novamente nos outros dispositivos.' };
    }
}