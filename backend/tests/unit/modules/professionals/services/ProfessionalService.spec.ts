import { ProfessionalService } from '../../../../../src/modules/professionals/services/ProfessionalService';
import { prisma } from '../../../../../src/lib/prisma';
import { AppError } from '../../../../../src/shared/errors/AppError';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        professional: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
        appointment: {
            updateMany: jest.fn(),
        },
    },
}));

describe('ProfessionalService (Unit)', () => {
    let professionalService: ProfessionalService;
    const tenantId = 'tenant-123';

    beforeEach(() => {
        professionalService = new ProfessionalService();
        jest.clearAllMocks();
    });

    // ── findById() ──────────────────────────────────────────────────────────

    it('deve retornar profissional ativo quando encontrado', async () => {
        const professional = {
            id: 'prof-1',
            name: 'João Barbeiro',
            email: 'joao@test.com',
            role: 'BARBER',
            commissionRate: 40,
            avatarUrl: null,
        };

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(professional);

        const result = await professionalService.findById(tenantId, 'prof-1');

        expect(prisma.professional.findFirst).toHaveBeenCalledWith({
            where: { id: 'prof-1', tenantId, active: true },
            select: { id: true, name: true, email: true, role: true, commissionRate: true, avatarUrl: true },
        });
        expect(result).toEqual(professional);
    });

    it('deve lancar AppError 404 quando profissional nao for encontrado', async () => {
        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(professionalService.findById(tenantId, 'nonexistent'))
            .rejects.toBeInstanceOf(AppError);
        await expect(professionalService.findById(tenantId, 'nonexistent'))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    // ── deactivate() ────────────────────────────────────────────────────────

    it('deve desativar profissional e cancelar agendamentos pendentes', async () => {
        const profId = 'prof-barber';
        const requesterId = 'prof-admin';
        const existing = { id: profId, tenantId, name: 'Carlos', role: 'BARBER', active: true };
        const deactivated = { id: profId, name: 'Carlos', active: false };

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.appointment.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
        (prisma.professional.update as jest.Mock).mockResolvedValue(deactivated);

        const result = await professionalService.deactivate(tenantId, profId, requesterId);

        expect(prisma.appointment.updateMany).toHaveBeenCalledWith({
            where: {
                tenantId,
                professionalId: profId,
                status: 'PENDING',
                startTime: { gt: expect.any(Date) },
            },
            data: { status: 'CANCELED' },
        });
        expect(prisma.professional.update).toHaveBeenCalledWith({
            where: { id: profId },
            data: { active: false },
            select: { id: true, name: true, active: true },
        });
        expect(result.active).toBe(false);
    });

    it('deve lancar AppError 400 ao tentar desativar a si mesmo', async () => {
        const profId = 'prof-admin';
        const existing = { id: profId, tenantId, name: 'Admin', role: 'ADMIN', active: true };

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(existing);

        await expect(professionalService.deactivate(tenantId, profId, profId))
            .rejects.toBeInstanceOf(AppError);
        await expect(professionalService.deactivate(tenantId, profId, profId))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    it('deve lancar AppError 400 ao desativar o unico ADMIN', async () => {
        const profId = 'prof-admin';
        const requesterId = 'prof-other-admin';
        const existing = { id: profId, tenantId, name: 'Admin', role: 'ADMIN', active: true };

        (prisma.professional.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.professional.count as jest.Mock).mockResolvedValue(1); // Único admin

        await expect(professionalService.deactivate(tenantId, profId, requesterId))
            .rejects.toBeInstanceOf(AppError);
        await expect(professionalService.deactivate(tenantId, profId, requesterId))
            .rejects.toMatchObject({ statusCode: 400 });
    });
});
