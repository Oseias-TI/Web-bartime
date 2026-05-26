import { Request, Response } from 'express';
import { ServiceService } from '../services/ServiceService';
import { CreateServiceSchema, UpdateServiceSchema } from '../dtos/CreateServiceSchema';
import { asyncHandler } from '../../../shared/utils/asyncHandler';

export class ServiceController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const data = CreateServiceSchema.parse(req.body);
        const result = await new ServiceService().create(req.user.tenantId, data);
        return res.status(201).json(result);
    });

    list = asyncHandler(async (req: Request, res: Response) => {
        const result = await new ServiceService().listAll(req.user.tenantId);
        return res.json(result);
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const data = UpdateServiceSchema.parse(req.body);
        const result = await new ServiceService().update(req.user.tenantId, req.params.id, data);
        return res.json(result);
    });

    deactivate = asyncHandler(async (req: Request, res: Response) => {
        await new ServiceService().deactivate(req.user.tenantId, req.params.id);
        return res.status(204).send();
    });
}