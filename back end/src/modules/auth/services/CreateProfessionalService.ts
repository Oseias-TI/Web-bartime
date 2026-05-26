import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../../../shared/errors/AppError';
import { z } from 'zod';

export const CreateProfessionalSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['BARBER', 'RECEPTIONIST']),
    commissionRate: z.number().min(0).max(100).default(50),
});

export type CreateProfessionalInput = z.infer<typeof CreateProfessionalSchema>;

export class CreateProfessionalService {
    async execute(tenantId: string, data: CreateProfessionalInput) {
        const exists = await prisma.professional.findUnique({
            where: { tenantId_email: { tenantId, email: data.email } },
        });
        if (exists) throw new AppError('Este e-mail já está cadastrado nesta barbearia.', 409);

        const passwordHash = await bcrypt.hash(data.password, 10);

        return prisma.professional.create({
            data: { tenantId, name: data.name, email: data.email, password: passwordHash, role: data.role, commissionRate: data.commissionRate },
            select: { id: true, name: true, email: true, role: true, commissionRate: true, avatarUrl: true, active: true },
        });
    }
}