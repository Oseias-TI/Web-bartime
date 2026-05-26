import { z } from 'zod';

export const CreateClientSchema = z.object({
    name: z.string().min(3),
    phone: z.string().regex(/^\d{10,11}$/, { message: 'Telefone deve ter 10 ou 11 dígitos.' }),
    preferences: z.string().optional(),
});