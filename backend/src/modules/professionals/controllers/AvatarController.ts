import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { AppError } from '../../../shared/errors/AppError';

export class AvatarController {
    update = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) throw new AppError('Nenhuma imagem foi enviada.', 400);
        
        let fileUrl: string;
        const s3File = req.file as any;
        if (s3File.key && process.env.AWS_PUBLIC_URL) {
            fileUrl = `${process.env.AWS_PUBLIC_URL}/${s3File.key}`;
        } else {
            fileUrl = `http://localhost:${process.env.PORT || 3333}/uploads/avatars/${req.file.filename}`;
        }
        
        await prisma.professional.update({ where: { id: req.user.id, tenantId: req.user.tenantId }, data: { avatarUrl: fileUrl } });
        return res.json({ message: 'Avatar atualizado com sucesso.', avatarUrl: fileUrl });
    });
}