import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { ProfessionalReportService } from '../services/ProfessionalReportService';
import { PeriodQuerySchema } from '../../financial/dtos/PeriodQuerySchema';

function parsePeriod(start: string, end: string) {
    return { startDate: new Date(`${start}T00:00:00.000Z`), endDate: new Date(`${end}T23:59:59.999Z`) };
}

export class ReportController {
    generate = asyncHandler(async (req: Request, res: Response) => {
        const { tenantId } = req.user;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const start = req.query.start ? new Date(`${req.query.start}T00:00:00.000Z`) : startOfMonth;
        const end = req.query.end ? new Date(`${req.query.end}T23:59:59.999Z`) : now;

        const [totalAllAppointments, completedAppointments, canceledAppointments, revenue, pendingCommissions, topProfessionalsData, newClients, appointmentsByPayment, topServicesData] =
            await Promise.all([
                prisma.appointment.count({ where: { tenantId, startTime: { gte: start, lte: end } } }),
                prisma.appointment.count({ where: { tenantId, status: 'COMPLETED', startTime: { gte: start, lte: end } } }),
                prisma.appointment.count({ where: { tenantId, status: 'CANCELED', startTime: { gte: start, lte: end } } }),
                prisma.transaction.aggregate({ where: { tenantId, type: 'INCOME', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
                prisma.commission.aggregate({ where: { tenantId, status: 'PENDING' }, _sum: { amount: true } }),
                prisma.commission.groupBy({ by: ['professionalId'], where: { tenantId, createdAt: { gte: start, lte: end } }, _sum: { amount: true }, _count: { professionalId: true }, orderBy: { _sum: { amount: 'desc' } }, take: 5 }),
                prisma.client.count({ where: { tenantId, createdAt: { gte: start, lte: end } } }),
                prisma.appointment.groupBy({ by: ['paymentMethod'], where: { tenantId, status: 'COMPLETED', startTime: { gte: start, lte: end } }, _count: { paymentMethod: true } }),
                prisma.appointment.groupBy({ by: ['serviceId'], where: { tenantId, status: 'COMPLETED', startTime: { gte: start, lte: end } }, _count: { serviceId: true }, orderBy: { _count: { serviceId: 'desc' } }, take: 5 })
            ]);

        const profIds = topProfessionalsData.map(p => p.professionalId);
        const profNames = await prisma.professional.findMany({ where: { id: { in: profIds } }, select: { id: true, name: true } });
        
        const serviceIds = topServicesData.map(s => s.serviceId);
        const serviceInfos = await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true, price: true } });

        const totalRevenue = Number(revenue._sum.amount ?? 0);
        const totalPending = Number(pendingCommissions._sum.amount ?? 0);
        const totalAll = totalAllAppointments;
        
        const topServices = topServicesData.map(s => {
            const info = serviceInfos.find(si => si.id === s.serviceId);
            return {
                name: info?.name ?? 'Desconhecido',
                count: s._count.serviceId,
                revenue: Number(info?.price ?? 0) * s._count.serviceId
            };
        });

        const topProfessionals = topProfessionalsData.map(p => ({
            name: profNames.find(pn => pn.id === p.professionalId)?.name ?? 'Desconhecido',
            count: p._count.professionalId,
            revenue: Number(p._sum.amount ?? 0),
            professionalId: p.professionalId,
        }));

        return res.json({
            period: { start, end },
            totalAppointments: totalAll,
            completedAppointments: completedAppointments,
            canceledAppointments,
            cancellationRate: totalAll > 0 ? Number(((canceledAppointments / totalAll) * 100).toFixed(1)) : 0,
            totalRevenue,
            pendingCommissions: totalPending,
            netProfit: totalRevenue - totalPending,
            newClients,
            averageTicket: completedAppointments > 0 ? Number((totalRevenue / completedAppointments).toFixed(2)) : 0,
            topServices,
            topProfessionals,
            appointmentsByPayment: appointmentsByPayment.map(a => ({ method: a.paymentMethod ?? 'N/A', count: a._count.paymentMethod })),
        });
    });

    generateByProfessional = asyncHandler(async (req: Request, res: Response) => {
        const { start, end } = PeriodQuerySchema.parse(req.query);
        const { startDate, endDate } = parsePeriod(start, end);
        const result = await new ProfessionalReportService().generate({ tenantId: req.user.tenantId, professionalId: req.params.id, start: startDate, end: endDate });
        return res.json(result);
    });
}