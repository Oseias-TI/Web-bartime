import { Request, Response } from 'express';
import { ClientAuthService } from '../services/ClientAuthService';
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
        const { name, email, phone, password } = req.body;

        const result = await new ClientAuthService().registerClient({
            slug,
            name,
            email,
            phone,
            password
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
}
