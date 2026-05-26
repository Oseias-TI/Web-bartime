import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const preprocessTime = (val: any) => val === "" ? null : val;

const DaySchema = z
    .object({ 
        dayOfWeek: z.number().int().min(0).max(6), 
        openTime: z.preprocess(preprocessTime, z.string().regex(timeRegex, "Horário inválido").nullable().optional()), 
        closeTime: z.preprocess(preprocessTime, z.string().regex(timeRegex, "Horário inválido").nullable().optional()), 
        open: z.boolean() 
    })
    .refine(data => !data.open || (data.openTime && data.closeTime && data.openTime < data.closeTime), { message: 'Se estiver aberto, informe abertura e fechamento válidos (abertura < fechamento).' });

export const BusinessHourSchema = z.object({
    hours: z
        .array(DaySchema)
        .length(7, { message: 'Envie os 7 dias da semana.' })
        .refine(days => JSON.stringify(days.map(d => d.dayOfWeek).sort()) === JSON.stringify([0, 1, 2, 3, 4, 5, 6]), { message: 'Envie cada dia exatamente uma vez.' }),
});

export type BusinessHourInput = z.infer<typeof BusinessHourSchema>;
export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];