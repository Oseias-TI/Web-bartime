import { Request, Response } from 'express';
import { AuthenticateBusinessService } from '../services/AuthenticateBusinessService';
import { RegisterTenantService } from '../services/RegisterTenantService';
import { CreateProfessionalService, CreateProfessionalSchema } from '../services/CreateProfessionalService';
import { RefreshTokenService } from '../services/RefreshTokenService';
import { ForgotPasswordService } from '../services/ForgotPasswordService';
import { ResetPasswordService } from '../services/ResetPasswordService';
import { ChangePasswordService } from '../services/ChangePasswordService';
import { SendVerificationEmailService } from '../services/SendVerificationEmailService';
import { VerifyEmailService } from '../services/VerifyEmailService';
import { AuthSchema } from '../dtos/AuthSchema';
import { RegisterSchema } from '../dtos/RegisterSchema';
import { RefreshTokenSchema } from '../dtos/RefreshTokenSchema';
import { ForgotPasswordSchema } from '../dtos/ForgotPasswordSchema';
import { ResetPasswordSchema } from '../dtos/ResetPasswordSchema';
import { ChangePasswordSchema } from '../dtos/ChangePasswordSchema';
import { asyncHandler } from '../../../shared/utils/asyncHandler';

export class AuthController {
    register = asyncHandler(async (req: Request, res: Response) => {
        const data = RegisterSchema.parse(req.body);
        const consentIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
        const result = await new RegisterTenantService().execute({ ...data, consentIp: consentIp || undefined });
        return res.status(201).json(result);
    });

    loginBusiness = asyncHandler(async (req: Request, res: Response) => {
        const data = AuthSchema.parse(req.body);
        const result = await new AuthenticateBusinessService().execute(data);
        return res.json(result);
    });

    refresh = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = RefreshTokenSchema.parse(req.body);
        const result = await new RefreshTokenService().rotate(refreshToken);
        return res.json(result);
    });

    logout = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = RefreshTokenSchema.parse(req.body);
        await new RefreshTokenService().revoke(refreshToken);
        return res.json({ message: 'Logout realizado com sucesso.' });
    });

    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const { email } = ForgotPasswordSchema.parse(req.body);
        await new ForgotPasswordService().execute(email);
        return res.json({ message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' });
    });

    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const { token, password } = ResetPasswordSchema.parse(req.body);
        const result = await new ResetPasswordService().execute(token, password);
        return res.json(result);
    });

    changePassword = asyncHandler(async (req: Request, res: Response) => {
        const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);
        const result = await new ChangePasswordService().execute({
            professionalId: req.user.id,
            currentPassword,
            newPassword,
        });
        return res.json(result);
    });

    verifyEmail = asyncHandler(async (req: Request, res: Response) => {
        const token = req.query.token as string;
        if (!token) return res.status(400).json({ error: 'Token de verificação é obrigatório.' });
        const result = await new VerifyEmailService().execute(token);
        return res.json(result);
    });

    resendVerification = asyncHandler(async (req: Request, res: Response) => {
        await new SendVerificationEmailService().execute(req.user.id);
        return res.json({ message: 'E-mail de verificação reenviado.' });
    });

    createProfessional = asyncHandler(async (req: Request, res: Response) => {
        const data = CreateProfessionalSchema.parse(req.body);
        const result = await new CreateProfessionalService().execute(req.user.tenantId, data);
        return res.status(201).json(result);
    });
}