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

    async findById(id: string, tenantId: string): Promise<IAppointmentResponse | null> {
        return prisma.appointment.findFirst({
            where: { id, tenantId },
            include: {
                service: true,
                professional: true,
                client: true
            }
        }) as unknown as IAppointmentResponse | null;
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

    async cancelAppointmentWithCommissions(appointmentId: string): Promise<any> {
        return prisma.$transaction(async (tx) => {
            await tx.commission.updateMany({
                where: { appointmentId, status: 'PENDING' },
                data: { status: 'CANCELED' },
            });

            return tx.appointment.update({
                where: { id: appointmentId },
                data: { status: 'CANCELED' },
                include: { client: { select: { name: true, phone: true } }, service: { select: { name: true } }, professional: { select: { name: true } } },
            });
        });
    }

    async completeAppointmentAndCreateFinancials(
        appointmentId: string, 
        paymentMethod: string, 
        servicePrice: number, 
        commissionAmount: number,
        tenantId: string,
        professionalId: string,
        clientId: string,
        serviceName: string,
        professionalName: string
    ): Promise<{ appointment: any, commission: any, revenue: number }> {
        return prisma.$transaction(async tx => {
            const updated = await tx.appointment.update({ where: { id: appointmentId }, data: { status: 'COMPLETED', paymentMethod } });
            
            const commission = await tx.commission.create({
                data: { tenantId, appointmentId, professionalId, amount: commissionAmount, status: 'PENDING' },
            });
            
            await tx.transaction.create({
                data: { tenantId, appointmentId, type: 'INCOME', category: serviceName, paymentMethod, amount: servicePrice, description: `${serviceName} — ${professionalName}` },
            });
            
            await tx.client.update({ where: { id: clientId }, data: { loyaltyPoints: { increment: 1 } } });
            
            return { appointment: updated, commission, revenue: servicePrice };
        });
    }
}
