import { Request, Response } from 'express';
import { AvailabilityService } from '../services/AvailabilityService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { z } from 'zod';

const AvailabilityQuerySchema = z.object({
    professionalId: z.string().uuid(),
    serviceId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export class AvailabilityController {
    getSlots = asyncHandler(async (req: Request, res: Response) => {
        const { professionalId, serviceId, date } = AvailabilityQuerySchema.parse(req.query);
        const slots = await new AvailabilityService().getSlots({ tenantId: req.user.tenantId, professionalId, serviceId, date });
        return res.json({ date, professionalId, serviceId, totalSlots: slots.length, availableSlots: slots.filter(s => s.available).length, slots });
    });
}