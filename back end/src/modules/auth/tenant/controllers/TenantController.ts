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
        console.log("Recebeu PATCH /tenant/logo");
        console.log("req.file:", req.file);
        console.log("req.body:", req.body);
        console.log("headers:", req.headers);
        if (!req.file) throw new AppError('Nenhuma imagem foi enviada.', 400);
        
        let fileUrl: string;
        const s3File = req.file as any;
        if (s3File.key && process.env.AWS_PUBLIC_URL) {
            fileUrl = `${process.env.AWS_PUBLIC_URL}/${s3File.key}`;
        } else {
            fileUrl = `http://localhost:${process.env.PORT || 3333}/uploads/avatars/${req.file.filename}`;
        }
        
        const result = await new TenantService().updateLogo(req.user.tenantId, fileUrl);
        return res.json({ message: 'Logo atualizada com sucesso.', ...result });
    });
}