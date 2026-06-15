import { z } from 'zod';

export const CompleteAppointmentSchema = z.object({
    paymentMethod: z.enum(['CASH', 'CARD_DEBIT', 'CARD_CREDIT', 'PIX']),
});