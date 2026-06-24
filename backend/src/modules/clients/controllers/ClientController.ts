import { Request, Response } from 'express';
import { ClientService } from '../services/ClientService';
import { CreateClientSchema } from '../dtos/CreateClientSchema';
import { UpdateClientSchema } from '../dtos/UpdateClientSchema';
import { RedeemPointsSchema } from '../dtos/RedeemPointsSchema';
import { asyncHandler } from '../../../shared/utils/asyncHandler';

export class ClientController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const data = CreateClientSchema.parse(req.body);
        const client = await new ClientService().createClient({ ...data, tenantId: req.user.tenantId });
        return res.status(201).json(client);
    });

    list = asyncHandler(async (req: Request, res: Response) => {
        const search = req.query.search as string | undefined;
        const clients = await new ClientService().listAll(req.user.tenantId, search, req.query);
        return res.json(clients);
    });

    showProfile = asyncHandler(async (req: Request, res: Response) => {
        const profile = await new ClientService().getClientProfile(req.user.tenantId, req.params.id);
        return res.json(profile);
    });

    showSpending = asyncHandler(async (req: Request, res: Response) => {
        const result = await new ClientService().getClientSpending(req.user.tenantId, req.params.id);
        return res.json(result);
    });

    listInactive = asyncHandler(async (req: Request, res: Response) => {
        const days = Number(req.query.days) || 30;
        const result = await new ClientService().getInactiveClients(req.user.tenantId, days);
        return res.json(result);
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const data = UpdateClientSchema.parse(req.body);
        const updated = await new ClientService().updateClient(req.user.tenantId, req.params.id, data);
        return res.json(updated);
    });

    redeemPoints = asyncHandler(async (req: Request, res: Response) => {
        const { points } = RedeemPointsSchema.parse(req.body);
        const result = await new ClientService().redeemPoints(req.user.tenantId, req.params.id, points);
        return res.json(result);
    });

    listClientAppointments = asyncHandler(async (req: Request, res: Response) => {
        // req.user has { id: clientId, tenantId } because of ensureClientAuthenticated
        const result = await new ClientService().getClientAppointments(req.user.tenantId, req.user.id);
        return res.json(result);
    });

    // ═══════════════════════════════════════════════
    //  LGPD — Direitos do Titular (Art. 18)
    // ═══════════════════════════════════════════════

    // LGPD Art. 18, V — Portabilidade (admin exporta dados de um cliente)
    exportClientData = asyncHandler(async (req: Request, res: Response) => {
        const result = await new ClientService().exportClientData(req.user.tenantId, req.params.id);
        return res.json(result);
    });

    // LGPD Art. 18, V — Portabilidade (cliente exporta seus próprios dados)
    exportOwnData = asyncHandler(async (req: Request, res: Response) => {
        const result = await new ClientService().exportClientData(req.user.tenantId, req.user.id);
        return res.json(result);
    });

    // LGPD Art. 18, VI — Exclusão (admin anonimiza dados de um cliente)
    anonymizeClientData = asyncHandler(async (req: Request, res: Response) => {
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || undefined;
        const result = await new ClientService().anonymizeClient(req.user.tenantId, req.params.id, ipAddress);
        return res.json(result);
    });

    // LGPD Art. 18, VI — Exclusão (cliente solicita anonimização dos próprios dados)
    anonymizeOwnData = asyncHandler(async (req: Request, res: Response) => {
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || undefined;
        const result = await new ClientService().anonymizeClient(req.user.tenantId, req.user.id, ipAddress);
        return res.json(result);
    });
}