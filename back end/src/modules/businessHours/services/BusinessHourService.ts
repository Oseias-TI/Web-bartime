import { prisma } from '../../../lib/prisma';
import { BusinessHourInput, DAY_NAMES } from '../dtos/BusinessHourSchema';

export class BusinessHourService {
    async upsert(tenantId: string, { hours }: BusinessHourInput) {
        return prisma.$transaction(async tx => {
            await tx.businessHour.deleteMany({ where: { tenantId } });
            const created = await tx.businessHour.createMany({
                data: hours.map(h => ({ tenantId, dayOfWeek: h.dayOfWeek, openTime: h.open ? h.openTime : null, closeTime: h.open ? h.closeTime : null, open: h.open })),
            });
            return { message: 'Horários salvos com sucesso.', count: created.count };
        });
    }

    async list(tenantId: string) {
        const hours = await prisma.businessHour.findMany({ where: { tenantId }, orderBy: { dayOfWeek: 'asc' } });
        return Array.from({ length: 7 }, (_, day) => {
            const configured = hours.find(h => h.dayOfWeek === day);
            const isWeekday = day > 0 && day < 6;
            return { 
                dayOfWeek: day, 
                dayName: DAY_NAMES[day], 
                open: configured ? configured.open : isWeekday, 
                openTime: configured ? configured.openTime : (isWeekday ? "09:00" : null), 
                closeTime: configured ? configured.closeTime : (isWeekday ? "18:00" : null) 
            };
        });
    }
}