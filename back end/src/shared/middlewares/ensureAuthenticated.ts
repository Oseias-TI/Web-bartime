import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });

    const [, token] = authHeader.split(' ');

    try {
        const decoded = verify(token, process.env.JWT_SECRET as string);
        const { sub, tenantId, role } = decoded as any;
        req.user = { id: sub, tenantId, role };
        return next();
    } catch {
        return res.status(401).json({ error: 'Token inválido.' });
    }
}