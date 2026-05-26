import { z } from 'zod';

export const UpdateProfessionalSchema = z.object({
    name: z.string().min(3).optional(),
    role: z.enum(['BARBER', 'RECEPTIONIST', 'ADMIN']).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
});

export type UpdateProfessionalInput = z.infer<typeof UpdateProfessionalSchema>;