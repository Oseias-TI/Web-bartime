import { z } from 'zod';
import { localNowAsUTC } from '../../../shared/utils/timezone';

export const CreatePublicAppointmentSchema = z.object({
    serviceId: z.string().uuid({ message: 'ID de serviço inválido.' }),
    professionalId: z.string().uuid({ message: 'ID de profissional inválido.' }).optional(),
    clientName: z.string().min(3, { message: 'O nome do cliente deve ter no mínimo 3 caracteres.' }).max(100),
    clientPhone: z.string().min(10, { message: 'Telefone inválido.' }).max(20),
    clientEmail: z.string().email({ message: 'E-mail inválido.' }).optional().nullable(),
    startTime: z
        .string()
        .datetime()
        .refine(val => new Date(val).getTime() > localNowAsUTC(), {
            message: 'O agendamento deve ser para uma data futura.',
        }),
});

export type CreatePublicAppointmentInput = z.infer<typeof CreatePublicAppointmentSchema>;
