import { TransactionService } from '../../../../../src/modules/financial/services/TransactionService';
import { prisma } from '../../../../../src/lib/prisma';
import { AppError } from '../../../../../src/shared/errors/AppError';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        transaction: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

describe('TransactionService (Unit)', () => {
    let transactionService: TransactionService;
    const tenantId = 'tenant-123';

    beforeEach(() => {
        transactionService = new TransactionService();
        jest.clearAllMocks();
    });

it('deve criar uma transacao com dados validos', async () => {
        const txData = {
            tenantId,
            type: 'INCOME' as const,
            category: 'Serviço',
            amount: 50,
            description: 'Corte de cabelo',
        };
        const created = { id: 'tx-1', ...txData, createdAt: new Date() };

        (prisma.transaction.create as jest.Mock).mockResolvedValue(created);

        const result = await transactionService.create(txData);

        expect(prisma.transaction.create).toHaveBeenCalledWith({ data: txData });
        expect(result).toEqual(created);
    });

it('deve retornar transacao existente', async () => {
        const tx = { id: 'tx-1', tenantId, type: 'INCOME', amount: 50 };

        (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(tx);

        const result = await transactionService.findById(tenantId, 'tx-1');

        expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
            where: { id: 'tx-1', tenantId },
        });
        expect(result).toEqual(tx);
    });

    it('deve lancar AppError 404 quando transacao nao for encontrada', async () => {
        (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(transactionService.findById(tenantId, 'nonexistent'))
            .rejects.toBeInstanceOf(AppError);
        await expect(transactionService.findById(tenantId, 'nonexistent'))
            .rejects.toMatchObject({ statusCode: 404 });
    });

it('deve atualizar transacao manual (sem appointmentId)', async () => {
        const txId = 'tx-1';
        const existing = { id: txId, tenantId, type: 'EXPENSE', amount: 100, appointmentId: null };
        const updated = { ...existing, amount: 120 };

        (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.transaction.update as jest.Mock).mockResolvedValue(updated);

        const result = await transactionService.update(tenantId, txId, { amount: 120 });

        expect(prisma.transaction.update).toHaveBeenCalledWith({
            where: { id: txId },
            data: { amount: 120 },
        });
        expect(result.amount).toBe(120);
    });

    it('deve lancar AppError 400 ao tentar editar transacao vinculada a agendamento', async () => {
        const txId = 'tx-1';
        const existing = { id: txId, tenantId, type: 'INCOME', amount: 50, appointmentId: 'appt-1' };

        (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(existing);

        await expect(transactionService.update(tenantId, txId, { amount: 60 }))
            .rejects.toBeInstanceOf(AppError);
        await expect(transactionService.update(tenantId, txId, { amount: 60 }))
            .rejects.toMatchObject({ statusCode: 400 });

        expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

it('deve excluir transacao manual com sucesso', async () => {
        const txId = 'tx-1';
        const existing = { id: txId, tenantId, type: 'EXPENSE', amount: 100, appointmentId: null };

        (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.transaction.delete as jest.Mock).mockResolvedValue(existing);

        const result = await transactionService.remove(tenantId, txId);

        expect(prisma.transaction.delete).toHaveBeenCalledWith({ where: { id: txId } });
        expect(result.message).toMatch(/excluída/i);
    });

    it('deve lancar AppError 400 ao tentar excluir transacao vinculada a agendamento', async () => {
        const txId = 'tx-1';
        const existing = { id: txId, tenantId, type: 'INCOME', amount: 50, appointmentId: 'appt-1' };

        (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(existing);

        await expect(transactionService.remove(tenantId, txId))
            .rejects.toBeInstanceOf(AppError);
        await expect(transactionService.remove(tenantId, txId))
            .rejects.toMatchObject({ statusCode: 400 });

        expect(prisma.transaction.delete).not.toHaveBeenCalled();
    });
});
