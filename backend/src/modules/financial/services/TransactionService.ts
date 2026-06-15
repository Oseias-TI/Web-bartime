import { AppError } from '../../../shared/errors/AppError';
import { CreateTransactionInput } from '../dtos/CreateTransactionSchema';
import { UpdateTransactionInput } from '../dtos/UpdateTransactionSchema';
import { ITransactionRepository, ICreateTransactionData } from '../repositories/ITransactionRepository';
import { ICommissionRepository } from '../repositories/ICommissionRepository';
import { PrismaTransactionRepository } from '../repositories/implementations/PrismaTransactionRepository';
import { PrismaCommissionRepository } from '../repositories/implementations/PrismaCommissionRepository';

export class TransactionService {
    constructor(
        private transactionRepository: ITransactionRepository = new PrismaTransactionRepository(),
        private commissionRepository: ICommissionRepository = new PrismaCommissionRepository()
    ) {}

    async create(data: ICreateTransactionData) {
        return this.transactionRepository.create(data);
    }

    async listByPeriod(tenantId: string, start: Date, end: Date) {
        return this.transactionRepository.listByPeriod(tenantId, start, end);
    }

    async findById(tenantId: string, transactionId: string) {
        const transaction = await this.transactionRepository.findById(tenantId, transactionId);
        if (!transaction) throw new AppError('Transação não encontrada.', 404);
        return transaction;
    }

    async update(tenantId: string, transactionId: string, data: UpdateTransactionInput) {
        const transaction = await this.transactionRepository.findById(tenantId, transactionId);
        if (!transaction) throw new AppError('Transação não encontrada.', 404);
        if (transaction.appointmentId) throw new AppError('Transações geradas por agendamentos não podem ser editadas diretamente.', 400);
        
        return this.transactionRepository.update(transactionId, data);
    }

    async remove(tenantId: string, transactionId: string) {
        const transaction = await this.transactionRepository.findById(tenantId, transactionId);
        if (!transaction) throw new AppError('Transação não encontrada.', 404);
        if (transaction.appointmentId) throw new AppError('Transações geradas por agendamentos não podem ser excluídas.', 400);
        
        await this.transactionRepository.remove(transactionId);
        return { message: 'Transação excluída com sucesso.' };
    }

    async getDailyCashFlow(tenantId: string, start: Date, end: Date) {
        return this.transactionRepository.getDailyCashFlow(tenantId, start, end);
    }

    async getSummary(tenantId: string, start: Date, end: Date) {
        const pendingCommissions = await this.commissionRepository.aggregatePending(tenantId);
        return this.transactionRepository.getSummary(tenantId, start, end, pendingCommissions);
    }
}