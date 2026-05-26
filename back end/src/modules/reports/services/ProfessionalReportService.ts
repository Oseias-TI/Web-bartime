import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';

interface ProfessionalReportInput {
    tenantId: string;
    professionalId: string;
    start: Date;
    end: Date;
}

export class ProfessionalReportService {
    async generate({ tenantId, professionalId, start, end }: ProfessionalReportInput) {
        const professional = await prisma.professional.findFirst({
            where: { id: professionalId, tenantId },
            select: { id: true, name: true, role: true, commissionRate: true, avatarUrl: true },
        });
        if (!professional) throw new AppError('Profissional não encontrado.', 404);

        const [appointments, commissionsResult, topServices, appointmentsByStatus, revenueByPaymentMethod] =
            await Promise.all([
                prisma.appointment.findMany({ where: { tenantId, professionalId, startTime: { gte: start, lte: end } }, include: { service: { select: { name: true, price: true } } } }),
                prisma.commission.groupBy({ by: ['status'], where: { tenantId, professionalId, createdAt: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
                prisma.appointment.groupBy({ by: ['serviceId'], where: { tenantId, professionalId, status: 'COMPLETED', startTime: { gte: start, lte: end } }, _count: { serviceId: true }, orderBy: { _count: { serviceId: 'desc' } }, take: 5 }),
                prisma.appointment.groupBy({ by: ['status'], where: { tenantId, professionalId, startTime: { gte: start, lte: end } }, _count: { status: true } }),
                prisma.transaction.groupBy({ by: ['paymentMethod'], where: { tenantId, type: 'INCOME', createdAt: { gte: start, lte: end }, appointment: { professionalId } }, _sum: { amount: true } }),
            ]);

        const completed = appointments.filter(a => a.status === 'COMPLETED');
        const canceled = appointments.filter(a => a.status === 'CANCELED');
        const totalRevenue = completed.reduce((acc, a) => acc + Number(a.service.price), 0);
        const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;

        const commissions = { paid: 0, pending: 0 };
        for (const c of commissionsResult) {
            if (c.status === 'PAID') commissions.paid = Number(c._sum.amount ?? 0);
            if (c.status === 'PENDING') commissions.pending = Number(c._sum.amount ?? 0);
        }

        const serviceIds = topServices.map(s => s.serviceId);
        const serviceNames = await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true, price: true } });

        return {
            period: { start, end },
            professional,
            summary: {
                totalAppointments: appointments.length,
                completedAppointments: completed.length,
                canceledAppointments: canceled.length,
                cancellationRate: appointments.length > 0 ? ((canceled.length / appointments.length) * 100).toFixed(1) + '%' : '0%',
                totalRevenue: totalRevenue.toFixed(2),
                avgTicket: avgTicket.toFixed(2),
            },
            commissions: {
                paid: commissions.paid.toFixed(2),
                pending: commissions.pending.toFixed(2),
                total: (commissions.paid + commissions.pending).toFixed(2),
                rate: `${professional.commissionRate}%`,
            },
            byStatus: Object.fromEntries(appointmentsByStatus.map(s => [s.status, s._count.status])),
            topServices: topServices.map(s => ({
                serviceName: serviceNames.find(sn => sn.id === s.serviceId)?.name ?? 'Desconhecido',
                price: serviceNames.find(sn => sn.id === s.serviceId)?.price ?? 0,
                count: s._count.serviceId,
            })),
            revenueByPaymentMethod: revenueByPaymentMethod.map(r => ({ method: r.paymentMethod ?? 'N/A', total: Number(r._sum.amount ?? 0).toFixed(2) })),
        };
    }
}