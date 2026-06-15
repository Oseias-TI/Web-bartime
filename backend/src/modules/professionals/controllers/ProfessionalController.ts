import { Request, Response } from 'express';
import { ProfessionalService } from '../services/ProfessionalService';
import { UpdateProfessionalSchema } from '../dtos/UpdateProfessionalSchema';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { getPaginationParams } from '../../../shared/utils/paginate';

export class ProfessionalController {
    list = asyncHandler(async (req: Request, res: Response) => {
        const params = getPaginationParams(req.query);
        const result = await new ProfessionalService().listAll(req.user.tenantId, params);
        return res.json(result);
    });

    show = asyncHandler(async (req: Request, res: Response) => {
        const result = await new ProfessionalService().findById(req.user.tenantId, req.params.id);
        return res.json(result);
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const data = UpdateProfessionalSchema.parse(req.body);
        const result = await new ProfessionalService().update(req.user.tenantId, req.params.id, data);
        return res.json(result);
    });

    deactivate = asyncHandler(async (req: Request, res: Response) => {
        const result = await new ProfessionalService().deactivate(req.user.tenantId, req.params.id, req.user.id);
        return res.json({ message: `Profissional ${result.name} desativado com sucesso.` });
    });
}