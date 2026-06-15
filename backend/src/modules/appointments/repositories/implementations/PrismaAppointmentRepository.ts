import { prisma } from '../../../../lib/prisma';
import { IAppointmentRepository, ICreateAppointmentDTO, IAppointmentResponse } from '../IAppointmentRepository';

export class PrismaAppointmentRepository implements IAppointmentRepository {
    async create(data: ICreateAppointmentDTO): Promise<IAppointmentResponse> {
        return prisma.appointment.create({
            data: {
                tenantId: data.tenantId,
                clientId: data.clientId,
                professionalId: data.professionalId,
                serviceId: data.serviceId,
                startTime: data.startTime,
                endTime: data.endTime,
            },
            include: {
                service: true,
                professional: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true, email: true, phone: true } },
            },
        }) as unknown as IAppointmentResponse;
    }

    async findConflictingAppointment(tenantId: string, professionalId: string, startTime: Date, endTime: Date): Promise<boolean> {
        const conflict = await prisma.appointment.findFirst({
            where: {
                tenantId,
                professionalId,
                status: { not: 'CANCELED' },
                startTime: { lt: endTime },
                endTime: { gt: startTime },
            },
        });
        return !!conflict;
    }

    async findById(id: string, tenantId: string): Promise<any | null> {
        return prisma.appointment.findFirst({
            where: { id, tenantId },
        });
    }

    async updateGoogleEventId(id: string, googleEventId: string): Promise<void> {
        await prisma.appointment.update({
            where: { id },
            data: { googleEventId },
        });
    }

    async listByDay(tenantId: string, start: Date, end: Date, professionalId?: string, skip?: number, take?: number): Promise<any[]> {
        const where: any = { tenantId, startTime: { gte: start, lte: end } };
        if (professionalId) {
            where.professionalId = professionalId;
        }

        return prisma.appointment.findMany({
            where,
            include: {
                client: { select: { name: true, phone: true } },
                service: true,
                professional: { select: { name: true, id: true } },
            },
            orderBy: { startTime: 'asc' },
            skip,
            take,
        });
    }

    async countByDay(tenantId: string, start: Date, end: Date, professionalId?: string): Promise<number> {
        const where: any = { tenantId, startTime: { gte: start, lte: end } };
        if (professionalId) {
            where.professionalId = professionalId;
        }
        return prisma.appointment.count({ where });
    }
}
