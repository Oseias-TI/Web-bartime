import { Request, Response } from 'express';
import { CreateCheckoutSessionService } from '../services/CreateCheckoutSessionService';
import { CreatePortalSessionService } from '../services/CreatePortalSessionService';
import { BillingStatusService } from '../services/BillingStatusService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { prisma } from '../../../lib/prisma';

export class BillingController {
    status = asyncHandler(async (req: Request, res: Response) => {
        const result = await new BillingStatusService().get(req.user.tenantId);
        return res.json(result);
    });

    checkout = asyncHandler(async (req: Request, res: Response) => {
        const admin = await prisma.professional.findUnique({ where: { id: req.user.id }, select: { email: true, name: true } });
        const result = await new CreateCheckoutSessionService().execute({ tenantId: req.user.tenantId, adminEmail: admin?.email ?? '', adminName: admin?.name ?? '' });
        return res.json(result);
    });

    portal = asyncHandler(async (req: Request, res: Response) => {
        const result = await new CreatePortalSessionService().execute(req.user.tenantId);
        return res.json(result);
    });
}