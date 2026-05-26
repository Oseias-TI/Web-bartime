import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { AppError } from '../../../shared/errors/AppError';

export class AvatarController {
    update = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) throw new AppError('Nenhuma imagem foi enviada.', 400);
        const fileUrl = `${process.env.AWS_PUBLIC_URL}/${(req.file as any).key}`;
        // BUG-11: Filtrar por tenantId para evitar atualização cross-tenant
        await prisma.professional.update({ where: { id: req.user.id, tenantId: req.user.tenantId }, data: { avatarUrl: fileUrl } });
        return res.json({ message: 'Avatar atualizado com sucesso.', url: fileUrl });
    });
}