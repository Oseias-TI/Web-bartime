import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Erro de validação',
            errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    console.error('[INTERNAL ERROR]', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
}