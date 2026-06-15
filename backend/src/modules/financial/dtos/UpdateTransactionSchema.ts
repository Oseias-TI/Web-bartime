import { z } from 'zod';

export const UpdateTransactionSchema = z.object({
    category: z.string().min(1).optional(),
    paymentMethod: z.enum(['CASH', 'CARD_DEBIT', 'CARD_CREDIT', 'PIX']).optional(),
    amount: z.number().positive().optional(),
    description: z.string().optional(),
});

export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;