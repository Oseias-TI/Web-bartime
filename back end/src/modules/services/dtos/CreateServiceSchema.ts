import { z } from 'zod';

export const CreateServiceSchema = z.object({
    name: z.string().min(2),
    price: z.number().positive(),
    durationMin: z.number().int().min(10).max(480),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;