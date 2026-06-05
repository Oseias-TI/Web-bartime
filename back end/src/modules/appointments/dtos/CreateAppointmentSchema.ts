import { z } from 'zod';
import { localNowAsUTC } from '../../../shared/utils/timezone';

export const CreateAppointmentSchema = z.object({
    clientId: z.string().uuid(),
    serviceId: z.string().uuid(),
    professionalId: z.string().uuid(),
    startTime: z
        .string()
        .datetime()
        .refine(val => new Date(val).getTime() > localNowAsUTC(), {
            message: 'O agendamento deve ser para uma data futura.',
        }),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;