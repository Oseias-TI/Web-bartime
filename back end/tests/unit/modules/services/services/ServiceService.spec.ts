import { ServiceService } from '../../../../../src/modules/services/services/ServiceService';
import { prisma } from '../../../../../src/lib/prisma';
import { AppError } from '../../../../../src/shared/errors/AppError';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        service: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('ServiceService (Unit)', () => {
    let serviceService: ServiceService;
    const tenantId = 'tenant-123';

    beforeEach(() => {
        serviceService = new ServiceService();
        jest.clearAllMocks();
    });

    // ── create() ────────────────────────────────────────────────────────────

    it('deve criar um servico com dados validos', async () => {
        const data = { name: 'Corte Degradê', price: 45, durationMin: 30 };
        const created = { id: 'service-1', tenantId, ...data, active: true };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.service.create as jest.Mock).mockResolvedValue(created);

        const result = await serviceService.create(tenantId, data);

        expect(prisma.service.findFirst).toHaveBeenCalledWith({
            where: { tenantId, name: { equals: data.name, mode: 'insensitive' } },
        });
        expect(prisma.service.create).toHaveBeenCalledWith({ data: { ...data, tenantId } });
        expect(result).toEqual(created);
    });

    it('deve lancar AppError 409 quando nome do servico ja existir', async () => {
        const data = { name: 'Barba', price: 25, durationMin: 20 };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

        await expect(serviceService.create(tenantId, data)).rejects.toBeInstanceOf(AppError);
        await expect(serviceService.create(tenantId, data)).rejects.toMatchObject({ statusCode: 409 });
        expect(prisma.service.create).not.toHaveBeenCalled();
    });

    // ── listAll() ───────────────────────────────────────────────────────────

    it('deve retornar servicos ativos ordenados por nome', async () => {
        const services = [
            { id: 's1', name: 'Barba', price: 20, active: true },
            { id: 's2', name: 'Corte', price: 30, active: true },
        ];

        (prisma.service.findMany as jest.Mock).mockResolvedValue(services);

        const result = await serviceService.listAll(tenantId);

        expect(prisma.service.findMany).toHaveBeenCalledWith({
            where: { tenantId, active: true },
            orderBy: { name: 'asc' },
        });
        expect(result).toHaveLength(2);
    });

    // ── update() ────────────────────────────────────────────────────────────

    it('deve atualizar servico existente', async () => {
        const serviceId = 'service-1';
        const existing = { id: serviceId, tenantId, name: 'Corte', price: 30 };
        const updated = { ...existing, price: 35 };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.service.update as jest.Mock).mockResolvedValue(updated);

        const result = await serviceService.update(tenantId, serviceId, { price: 35 });

        expect(prisma.service.update).toHaveBeenCalledWith({
            where: { id: serviceId },
            data: { price: 35 },
        });
        expect(result.price).toBe(35);
    });

    it('deve lancar AppError 404 ao atualizar servico inexistente', async () => {
        (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(serviceService.update(tenantId, 'nonexistent', { price: 35 }))
            .rejects.toBeInstanceOf(AppError);
        await expect(serviceService.update(tenantId, 'nonexistent', { price: 35 }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    // ── deactivate() ────────────────────────────────────────────────────────

    it('deve desativar servico existente', async () => {
        const serviceId = 'service-1';
        const existing = { id: serviceId, tenantId, name: 'Corte', active: true };
        const deactivated = { ...existing, active: false };

        (prisma.service.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.service.update as jest.Mock).mockResolvedValue(deactivated);

        const result = await serviceService.deactivate(tenantId, serviceId);

        expect(prisma.service.update).toHaveBeenCalledWith({
            where: { id: serviceId },
            data: { active: false },
        });
        expect(result.active).toBe(false);
    });

    it('deve lancar AppError 404 ao desativar servico inexistente', async () => {
        (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(serviceService.deactivate(tenantId, 'nonexistent'))
            .rejects.toBeInstanceOf(AppError);
        await expect(serviceService.deactivate(tenantId, 'nonexistent'))
            .rejects.toMatchObject({ statusCode: 404 });
    });
});
