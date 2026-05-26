import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

const REFRESH_TOKEN_EXPIRES_DAYS = 7;
const ACCESS_TOKEN_EXPIRES = '15m';

export class RefreshTokenService {
    async generateTokens(professionalId: string, tenantId: string, role: string) {
        const accessToken = jwt.sign(
            { tenantId, role },
            process.env.JWT_SECRET as string,
            { subject: professionalId, expiresIn: ACCESS_TOKEN_EXPIRES }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

        // BUG-15: Não apagar todos os tokens — isso deslogava todos os dispositivos simultaneamente.
        // Tokens antigos expirarão naturalmente no prazo de REFRESH_TOKEN_EXPIRES_DAYS.
        await prisma.refreshToken.create({
            data: { token: refreshToken, professionalId, expiresAt },
        });

        return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_EXPIRES };
    }

    async rotate(refreshToken: string) {
        const stored = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { professional: true },
        });

        if (!stored) throw new AppError('Refresh token inválido.', 401);

        if (new Date() > stored.expiresAt) {
            await prisma.refreshToken.delete({ where: { token: refreshToken } });
            throw new AppError('Refresh token expirado. Faça login novamente.', 401);
        }

        if (!stored.professional.active) throw new AppError('Conta desativada.', 403);

        return this.generateTokens(
            stored.professional.id,
            stored.professional.tenantId,
            stored.professional.role
        );
    }

    async revoke(refreshToken: string) {
        await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
}