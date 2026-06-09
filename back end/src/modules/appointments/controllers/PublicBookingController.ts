import { Request, Response } from 'express';
import { PublicBookingService } from '../services/PublicBookingService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { CreatePublicAppointmentSchema } from '../dtos/CreatePublicAppointmentSchema';

export class PublicBookingController {
    getAllTenants = asyncHandler(async (req: Request, res: Response) => {
        const result = await new PublicBookingService().getAllTenants();
        return res.json(result);
    });

    getTenant = asyncHandler(async (req: Request, res: Response) => {
        const slug = req.params.slug.trim();
        const result = await new PublicBookingService().getTenantBySlug(slug);
        return res.json(result);
    });

    getServices = asyncHandler(async (req: Request, res: Response) => {
        const slug = req.params.slug.trim();
        const result = await new PublicBookingService().getServices(slug);
        return res.json(result);
    });

    getProfessionals = asyncHandler(async (req: Request, res: Response) => {
        const slug = req.params.slug.trim();
        const result = await new PublicBookingService().getProfessionals(slug);
        return res.json(result);
    });

    getAvailability = asyncHandler(async (req: Request, res: Response) => {
        const slug = req.params.slug.trim();
        const { date, professionalId, serviceId } = req.query;
        if (!date) return res.status(400).json({ error: 'Data é obrigatória' });
        const result = await new PublicBookingService().getAvailability(slug, date as string, professionalId as string, serviceId as string);
        return res.json(result);
    });

    createAppointment = asyncHandler(async (req: Request, res: Response) => {
        const slug = req.params.slug.trim();
        const data = CreatePublicAppointmentSchema.parse(req.body);
        const result = await new PublicBookingService().createAppointment({
            slug,
            ...data
        });
        return res.status(201).json(result);
    });
}
