import { Request, Response } from 'express';
import { PublicBookingService } from '../services/PublicBookingService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';

export class PublicBookingController {
    getTenant = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const result = await new PublicBookingService().getTenantBySlug(slug);
        return res.json(result);
    });

    getServices = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const result = await new PublicBookingService().getServices(slug);
        return res.json(result);
    });

    getProfessionals = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const result = await new PublicBookingService().getProfessionals(slug);
        return res.json(result);
    });

    getAvailability = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const { date, professionalId } = req.query;
        if (!date) return res.status(400).json({ error: 'Data é obrigatória' });
        const result = await new PublicBookingService().getAvailability(slug, date as string, professionalId as string);
        return res.json(result);
    });

    createAppointment = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const result = await new PublicBookingService().createAppointment({
            slug,
            ...req.body
        });
        return res.status(201).json(result);
    });
}
