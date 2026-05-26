import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
    clientId: z.string().uuid(),
    serviceId: z.string().uuid(),
    professionalId: z.string().uuid(),
    startTime: z
        .string()
        .datetime()
        .refine(val => new Date(val) > new Date(), { message: 'O agendamento deve ser para uma data futura.' }),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;