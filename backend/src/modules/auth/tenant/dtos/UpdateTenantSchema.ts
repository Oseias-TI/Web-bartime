import { z } from 'zod';

export const UpdateTenantSchema = z.object({
    name: z.string().min(3, { message: 'Nome deve ter no mínimo 3 caracteres.' }).optional(),
    logoUrl: z.string().url({ message: 'URL da logo inválida.' }).optional().nullable(),
});

export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;