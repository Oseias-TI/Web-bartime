import { Request, Response, NextFunction } from 'express';

export function ensureSuperAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Acesso restrito a super administradores.' });
    }
    return next();
}