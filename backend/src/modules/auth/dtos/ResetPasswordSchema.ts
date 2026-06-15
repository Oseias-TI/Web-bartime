import { z } from 'zod';

export const ResetPasswordSchema = z.object({
    token: z.string().min(1, { message: 'Token é obrigatório.' }),
    password: z
        .string()
        .min(8)
        .regex(/[A-Z]/, { message: 'Senha deve ter ao menos uma letra maiúscula.' })
        .regex(/[0-9]/, { message: 'Senha deve ter ao menos um número.' }),
});