import { z } from 'zod';

export const RegisterSchema = z.object({
    tenantName: z.string().min(3),
    cnpj: z.string().regex(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos sem pontuação.' }),
    adminName: z.string().min(3),
    email: z.string().email(),
    password: z
        .string()
        .min(8)
        .regex(/[A-Z]/, { message: 'Senha deve ter ao menos uma letra maiúscula.' })
        .regex(/[0-9]/, { message: 'Senha deve ter ao menos um número.' }),
    consentVersion: z.string().optional(),
    consentIp: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;