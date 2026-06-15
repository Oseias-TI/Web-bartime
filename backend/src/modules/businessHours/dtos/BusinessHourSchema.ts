import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const preprocessTime = (val: any) => val === "" ? null : val;

const DaySchema = z
    .object({ 
        dayOfWeek: z.number().int().min(0).max(6), 
        openTime: z.preprocess(preprocessTime, z.string().regex(timeRegex, "Horário inválido").nullable().optional()), 
        closeTime: z.preprocess(preprocessTime, z.string().regex(timeRegex, "Horário inválido").nullable().optional()), 
        openTime2: z.preprocess(preprocessTime, z.string().regex(timeRegex, "Horário inválido").nullable().optional()), 
        closeTime2: z.preprocess(preprocessTime, z.string().regex(timeRegex, "Horário inválido").nullable().optional()), 
        open: z.boolean() 
    })
    .refine(data => {
        if (!data.open) return true;
        // Validação Turno 1
        if (!data.openTime || !data.closeTime || data.openTime >= data.closeTime) return false;
        // Validação Turno 2 (opcional)
        if (data.openTime2 || data.closeTime2) {
            if (!data.openTime2 || !data.closeTime2) return false; // Deve ter os dois ou nenhum
            if (data.openTime2 >= data.closeTime2) return false; // Inicio 2 < Fim 2
            if (data.openTime2 <= data.closeTime) return false; // Turno 2 deve ser depois do Turno 1
        }
        return true;
    }, { message: 'Se estiver aberto, informe horários válidos. O turno 2 (se houver) deve começar após o fim do turno 1.' });

export const BusinessHourSchema = z.object({
    hours: z
        .array(DaySchema)
        .length(7, { message: 'Envie os 7 dias da semana.' })
        .refine(days => JSON.stringify(days.map(d => d.dayOfWeek).sort()) === JSON.stringify([0, 1, 2, 3, 4, 5, 6]), { message: 'Envie cada dia exatamente uma vez.' }),
});

export type BusinessHourInput = z.infer<typeof BusinessHourSchema>;
export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];