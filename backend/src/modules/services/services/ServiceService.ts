import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { CreateServiceInput, UpdateServiceInput } from '../dtos/CreateServiceSchema';

export class ServiceService {
    async create(tenantId: string, data: CreateServiceInput) {
        const exists = await prisma.service.findFirst({ where: { tenantId, name: { equals: data.name, mode: 'insensitive' } } });
        if (exists) throw new AppError('Já existe um serviço com este nome.', 409);
        return prisma.service.create({ data: { ...data, tenantId } });
    }

    async listAll(tenantId: string) {
        return prisma.service.findMany({ where: { tenantId, active: true }, orderBy: { name: 'asc' } });
    }

    async update(tenantId: string, serviceId: string, data: UpdateServiceInput) {
        const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId } });
        if (!service) throw new AppError('Serviço não encontrado.', 404);

        if (data.name && data.name.toLowerCase() !== service.name.toLowerCase()) {
            const conflict = await prisma.service.findFirst({ where: { tenantId, name: { equals: data.name, mode: 'insensitive' } } });
            if (conflict) throw new AppError('Já existe um serviço com este nome.', 409);
        }

        return prisma.service.update({ where: { id: serviceId }, data });
    }

    async deactivate(tenantId: string, serviceId: string) {
        const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId } });
        if (!service) throw new AppError('Serviço não encontrado.', 404);
        return prisma.service.update({ where: { id: serviceId }, data: { active: false } });
    }
}