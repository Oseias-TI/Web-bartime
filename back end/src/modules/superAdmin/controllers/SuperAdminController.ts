import { Request, Response } from 'express';
import { SuperAdminService } from '../services/SuperAdminService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED', 'UNPAID']),
});

export class SuperAdminController {
    // GET /super-admin/stats
    stats = asyncHandler(async (req: Request, res: Response) => {
        const result = await new SuperAdminService().getPlatformStats();
        return res.json(result);
    });

    // GET /super-admin/tenants?search=&page=&limit=
    listTenants = asyncHandler(async (req: Request, res: Response) => {
        const search = req.query.search as string | undefined;
        const result = await new SuperAdminService().listTenants(req.query, search);
        return res.json(result);
    });

    // GET /super-admin/tenants/:id
    getTenant = asyncHandler(async (req: Request, res: Response) => {
        const result = await new SuperAdminService().getTenantDetails(req.params.id);
        return res.json(result);
    });

    // PATCH /super-admin/tenants/:id/status
    updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const { status } = UpdateStatusSchema.parse(req.body);
        const result = await new SuperAdminService().updateTenantStatus(req.params.id, status);
        return res.json(result);
    });
}