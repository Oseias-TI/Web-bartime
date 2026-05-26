import { Request, Response } from 'express';
import { TenantService } from '../services/TenantService';
import { UpdateTenantSchema } from '../dtos/UpdateTenantSchema';
import { asyncHandler } from '../../../../shared/utils/asyncHandler';
import { AppError } from '../../../../shared/errors/AppError';

export class TenantController {
    // GET /tenant — retorna dados da barbearia logada
    get = asyncHandler(async (req: Request, res: Response) => {
        const result = await new TenantService().get(req.user.tenantId);
        return res.json(result);
    });

    // PATCH /tenant — edita nome da barbearia
    update = asyncHandler(async (req: Request, res: Response) => {
        const data = UpdateTenantSchema.parse(req.body);
        const result = await new TenantService().update(req.user.tenantId, data);
        return res.json(result);
    });

    // PATCH /tenant/logo — faz upload da logo
    updateLogo = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) throw new AppError('Nenhuma imagem foi enviada.', 400);
        const fileUrl = `${process.env.AWS_PUBLIC_URL}/${(req.file as any).key}`;
        const result = await new TenantService().updateLogo(req.user.tenantId, fileUrl);
        return res.json({ message: 'Logo atualizada com sucesso.', ...result });
    });
}