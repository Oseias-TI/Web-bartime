import { Request, Response } from 'express';
import { SuperAdminService } from '../services/SuperAdminService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED', 'UNPAID']),
});

export class SuperAdminController {
    // GET /super-admin/stats
    stats = asyncHandler(async (req: Request, res: Response) => {
        const filter = req.query.filter as string | undefined;
        const result = await new SuperAdminService().getPlatformStats(filter);
        return res.json(result);
    });

    // GET /super-admin/tenants?search=&page=&limit=
    listTenants = asyncHandler(async (req: Request, res: Response) => {
        const search = req.query.search as string | undefined;
        const result = await new SuperAdminService().listTenants(req.query, search);
        return res.json(result);
    });

    // GET /super-admin/tenants/:id
    getTenant = asyncHandler(async (req: Request, res: Response) => {
        const result = await new SuperAdminService().getTenantDetails(req.params.id);
        return res.json(result);
    });

    // PATCH /super-admin/tenants/:id/status
    updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const { status } = UpdateStatusSchema.parse(req.body);
        const result = await new SuperAdminService().updateTenantStatus(req.params.id, status);
        return res.json(result);
    });

    // POST /super-admin/tenants
    createTenant = asyncHandler(async (req: Request, res: Response) => {
        const data = z.object({
            name: z.string(),
            cnpj: z.string(),
            slug: z.string(),
        }).parse(req.body);
        const result = await new SuperAdminService().createTenant(data);
        return res.status(201).json(result);
    });

    // PUT /super-admin/tenants/:id
    updateTenant = asyncHandler(async (req: Request, res: Response) => {
        const data = z.object({
            name: z.string().optional(),
            cnpj: z.string().optional(),
            slug: z.string().optional(),
        }).parse(req.body);
        const result = await new SuperAdminService().updateTenant(req.params.id, data);
        return res.json(result);
    });

    // DELETE /super-admin/tenants/:id
    deleteTenant = asyncHandler(async (req: Request, res: Response) => {
        const result = await new SuperAdminService().deleteTenant(req.params.id);
        return res.json(result);
    });

    // GET /super-admin/users?search=&page=&limit=
    listUsers = asyncHandler(async (req: Request, res: Response) => {
        const search = req.query.search as string | undefined;
        const result = await new SuperAdminService().listUsers(req.query, search);
        return res.json(result);
    });

    // PATCH /super-admin/users/:id/status
    updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
        const { active } = req.body;
        const result = await new SuperAdminService().updateUserStatus(req.params.id, active);
        return res.json(result);
    });

    // PATCH /super-admin/users/:id/password
    updateUserPassword = asyncHandler(async (req: Request, res: Response) => {
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
        }
        const result = await new SuperAdminService().updateUserPassword(req.params.id, password);
        return res.json(result);
    });
}