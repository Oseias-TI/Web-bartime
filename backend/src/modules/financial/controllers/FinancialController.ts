import { Request, Response } from 'express';
import { PayoutProfessionalService } from '../services/PayoutProfessionalService';
import { TransactionService } from '../services/TransactionService';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { CreateTransactionSchema } from '../dtos/CreateTransactionSchema';
import { UpdateTransactionSchema } from '../dtos/UpdateTransactionSchema';
import { PeriodQuerySchema } from '../dtos/PeriodQuerySchema';
import { z } from 'zod';

const PayoutSchema = z.object({ professionalId: z.string().uuid() });

function parsePeriod(start: string, end: string) {
    return { startDate: new Date(`${start}T00:00:00.000Z`), endDate: new Date(`${end}T23:59:59.999Z`) };
}

export class FinancialController {
    createTransaction = asyncHandler(async (req: Request, res: Response) => {
        const data = CreateTransactionSchema.parse(req.body);
        const result = await new TransactionService().create({ ...data, tenantId: req.user.tenantId });
        return res.status(201).json(result);
    });

    listTransactions = asyncHandler(async (req: Request, res: Response) => {
        const { start, end } = PeriodQuerySchema.parse(req.query);
        const { startDate, endDate } = parsePeriod(start, end);
        const result = await new TransactionService().listByPeriod(req.user.tenantId, startDate, endDate);
        return res.json(result);
    });

    getTransaction = asyncHandler(async (req: Request, res: Response) => {
        const result = await new TransactionService().findById(req.user.tenantId, req.params.id);
        return res.json(result);
    });

    updateTransaction = asyncHandler(async (req: Request, res: Response) => {
        const data = UpdateTransactionSchema.parse(req.body);
        const result = await new TransactionService().update(req.user.tenantId, req.params.id, data);
        return res.json(result);
    });

    deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
        const result = await new TransactionService().remove(req.user.tenantId, req.params.id);
        return res.json(result);
    });

    cashFlow = asyncHandler(async (req: Request, res: Response) => {
        const { start, end } = PeriodQuerySchema.parse(req.query);
        const { startDate, endDate } = parsePeriod(start, end);
        const result = await new TransactionService().getDailyCashFlow(req.user.tenantId, startDate, endDate);
        return res.json(result);
    });

    summary = asyncHandler(async (req: Request, res: Response) => {
        const { start, end } = PeriodQuerySchema.parse(req.query);
        const { startDate, endDate } = parsePeriod(start, end);
        const result = await new TransactionService().getSummary(req.user.tenantId, startDate, endDate);
        return res.json(result);
    });

    payout = asyncHandler(async (req: Request, res: Response) => {
        const { professionalId } = PayoutSchema.parse(req.body);
        const result = await new PayoutProfessionalService().execute({ professionalId, tenantId: req.user.tenantId });
        return res.json(result);
    });
}