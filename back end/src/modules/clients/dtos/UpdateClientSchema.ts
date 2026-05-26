import { z } from 'zod';

export const UpdateClientSchema = z.object({
    name: z.string().min(3).optional(),
    phone: z.string().regex(/^\d{10,11}$/).optional(),
    email: z.string().email().optional().nullable(),
    preferences: z.string().optional().nullable(),
});

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;