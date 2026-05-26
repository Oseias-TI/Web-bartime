import { z } from 'zod';

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'Senha atual é obrigatória.' }),
    newPassword: z
        .string()
        .min(8, { message: 'Nova senha deve ter no mínimo 8 caracteres.' })
        .regex(/[A-Z]/, { message: 'Nova senha deve ter ao menos uma letra maiúscula.' })
        .regex(/[0-9]/, { message: 'Nova senha deve ter ao menos um número.' }),
}).refine(data => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da senha atual.',
    path: ['newPassword'],
});