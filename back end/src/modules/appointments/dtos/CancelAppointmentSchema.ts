import { z } from 'zod';

export const CancelAppointmentSchema = z.object({
    reason: z.string().min(3).optional(),
});