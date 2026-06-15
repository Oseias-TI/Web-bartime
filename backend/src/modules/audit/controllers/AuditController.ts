import { Request, Response } from 'express';
import { AuditService } from '../services/AuditService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';

export class AuditController {
    list = asyncHandler(async (req: Request, res: Response) => {
        const result = await new AuditService().list(req.user.tenantId, req.query);
        return res.json(result);
    });
}