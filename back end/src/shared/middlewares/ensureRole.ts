import { Request, Response, NextFunction } from 'express';

export function ensureRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
        }
        return next();
    };
}