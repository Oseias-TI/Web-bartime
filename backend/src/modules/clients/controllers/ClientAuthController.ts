import { Request, Response } from 'express';
import { ClientAuthService } from '../services/ClientAuthService';
import { ClientForgotPasswordService } from '../services/ClientForgotPasswordService';
import { ClientResetPasswordService } from '../services/ClientResetPasswordService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';

export class ClientAuthController {
    login = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const { emailOrPhone, password } = req.body;

        const result = await new ClientAuthService().login({
            slug,
            emailOrPhone,
            password
        });

        return res.json(result);
    });

    register = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const { name, email, phone, password, consentVersion } = req.body;
        // LGPD: Capturar IP do cliente para registro de consentimento
        const consentIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;

        const result = await new ClientAuthService().registerClient({
            slug,
            name,
            email,
            phone,
            password,
            consentVersion,
            consentIp: consentIp || undefined,
        });

        return res.json(result);
    });

    setupPassword = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const { emailOrPhone, password } = req.body;

        const result = await new ClientAuthService().setupPassword({
            slug,
            emailOrPhone,
            password
        });

        return res.json(result);
    });

    findTenants = asyncHandler(async (req: Request, res: Response) => {
        const { contact } = req.query;
        const result = await new ClientAuthService().findTenants(contact as string);
        return res.json(result);
    });

    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;
        const { email } = req.body;
        await new ClientForgotPasswordService().execute(email, slug);
        return res.status(200).json({ message: 'E-mail de recuperação enviado com sucesso.' });
    });

    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const { token, password } = req.body;
        await new ClientResetPasswordService().execute(token, password);
        return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    });
}
