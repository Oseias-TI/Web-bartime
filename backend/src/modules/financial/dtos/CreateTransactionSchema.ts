import { z } from 'zod';

export const CreateTransactionSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.string().min(1, 'Categoria é obrigatória'),
    paymentMethod: z.enum(['CASH', 'CARD_DEBIT', 'CARD_CREDIT', 'PIX']).optional(),
    amount: z.number().positive(),
    description: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;