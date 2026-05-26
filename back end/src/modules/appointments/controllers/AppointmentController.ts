import { Request, Response } from 'express';
import { AppointmentService } from '../services/AppointmentService';
import { CompleteAppointmentService } from '../services/CompleteAppointmentService';
import { CancelAppointmentService } from '../services/CancelAppointmentService';
import { CreateAppointmentSchema } from '../dtos/CreateAppointmentSchema';
import { CompleteAppointmentSchema } from '../dtos/CompleteAppointmentSchema';
import { CancelAppointmentSchema } from '../dtos/CancelAppointmentSchema';
import { asyncHandler } from '../../../shared/utils/asyncHandler';

export class AppointmentController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const data = CreateAppointmentSchema.parse(req.body);
        const result = await new AppointmentService().createAppointment({ ...data, tenantId: req.user.tenantId });
        return res.status(201).json(result);
    });

    complete = asyncHandler(async (req: Request, res: Response) => {
        const { paymentMethod } = CompleteAppointmentSchema.parse(req.body);
        const result = await new CompleteAppointmentService().execute({ appointmentId: req.params.id, tenantId: req.user.tenantId, paymentMethod });
        return res.json(result);
    });

    cancel = asyncHandler(async (req: Request, res: Response) => {
        const { reason } = CancelAppointmentSchema.parse(req.body);
        const result = await new CancelAppointmentService().execute({ appointmentId: req.params.id, tenantId: req.user.tenantId, userId: req.user.id, userRole: req.user.role, reason });
        return res.json(result);
    });

    listByDay = asyncHandler(async (req: Request, res: Response) => {
        const { professionalId, date } = req.query as { professionalId: string; date: string };
        if (!professionalId || !date) return res.status(400).json({ error: 'professionalId e date são obrigatórios.' });
        const result = await new AppointmentService().listByProfessional(req.user.tenantId, professionalId, date, req.query);
        return res.json(result);
    });
}