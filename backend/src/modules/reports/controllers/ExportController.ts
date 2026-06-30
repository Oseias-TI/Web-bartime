import { Request, Response } from 'express';
import { ExportService } from '../services/ExportService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { PeriodQuerySchema } from '../../financial/dtos/PeriodQuerySchema';

function parsePeriod(start: string, end: string) {
    return { startDate: new Date(`${start}T00:00:00.000Z`), endDate: new Date(`${end}T23:59:59.999Z`) };
}

export class ExportController {
    excel = asyncHandler(async (req: Request, res: Response) => {
        const { start, end } = PeriodQuerySchema.parse(req.query);
        const { startDate, endDate } = parsePeriod(start, end);
        await new ExportService().exportToExcel({ tenantId: req.user.tenantId, start: startDate, end: endDate }, res);
    });

    pdf = asyncHandler(async (req: Request, res: Response) => {
        const { start, end } = PeriodQuerySchema.parse(req.query);
        const { startDate, endDate } = parsePeriod(start, end);
        await new ExportService().exportToPdf({ tenantId: req.user.tenantId, start: startDate, end: endDate }, res);
    });
}