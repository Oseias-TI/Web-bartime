import { Request, Response } from 'express';
import { BusinessHourService } from '../services/BusinessHourService';
import { BusinessHourSchema } from '../dtos/BusinessHourSchema';
import { asyncHandler } from '../../../shared/utils/asyncHandler';

export class BusinessHourController {
    list = asyncHandler(async (req: Request, res: Response) => {
        const result = await new BusinessHourService().list(req.user.tenantId);
        return res.json(result);
    });

    upsert = asyncHandler(async (req: Request, res: Response) => {
        const data = BusinessHourSchema.parse(req.body);
        const result = await new BusinessHourService().upsert(req.user.tenantId, data);
        return res.json(result);
    });
}