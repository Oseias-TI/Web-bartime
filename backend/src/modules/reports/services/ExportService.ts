import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { prisma } from '../../../lib/prisma';

interface ExportParams {
    tenantId: string;
    start: Date;
    end: Date;
}

export class ExportService {

    async exportToExcel(params: ExportParams, res: Response) {
        const { tenantId, start, end } = params;

        const [appointments, transactions, commissions] = await Promise.all([
            prisma.appointment.findMany({
                where: { tenantId, startTime: { gte: start, lte: end }, status: 'COMPLETED' },
                include: {
                    client: { select: { name: true, phone: true } },
                    professional: { select: { name: true } },
                    service: { select: { name: true, price: true } },
                },
                orderBy: { startTime: 'asc' },
            }),
            prisma.transaction.findMany({
                where: { tenantId, createdAt: { gte: start, lte: end } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.commission.findMany({
                where: { tenantId, createdAt: { gte: start, lte: end } },
                include: { professional: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Bartime';
        workbook.created = new Date();

        const sheetAppointments = workbook.addWorksheet('Atendimentos');
        sheetAppointments.columns = [
            { header: 'Data', key: 'date', width: 20 },
            { header: 'Horário', key: 'time', width: 10 },
            { header: 'Cliente', key: 'client', width: 25 },
            { header: 'Telefone', key: 'phone', width: 16 },
            { header: 'Serviço', key: 'service', width: 20 },
            { header: 'Profissional', key: 'professional', width: 20 },
            { header: 'Valor (R$)', key: 'price', width: 12 },
            { header: 'Pagamento', key: 'payment', width: 15 },
        ];

        sheetAppointments.getRow(1).font = { bold: true };
        sheetAppointments.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };
        sheetAppointments.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        for (const appt of appointments) {
            sheetAppointments.addRow({
                date: new Date(appt.startTime).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                time: new Date(appt.startTime).toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }),
                client: appt.client.name,
                phone: appt.client.phone,
                service: appt.service.name,
                professional: appt.professional.name,
                price: Number(appt.service.price),
                payment: appt.paymentMethod ?? 'N/A',
            });
        }

        const sheetFinancial = workbook.addWorksheet('Financeiro');
        sheetFinancial.columns = [
            { header: 'Data', key: 'date', width: 20 },
            { header: 'Tipo', key: 'type', width: 10 },
            { header: 'Categoria', key: 'category', width: 16 },
            { header: 'Descrição', key: 'description', width: 30 },
            { header: 'Forma de Pagamento', key: 'payment', width: 18 },
            { header: 'Valor (R$)', key: 'amount', width: 12 },
        ];

        sheetFinancial.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheetFinancial.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };

        for (const tx of transactions) {
            const row = sheetFinancial.addRow({
                date: new Date(tx.createdAt).toLocaleDateString('pt-BR'),
                type: tx.type === 'INCOME' ? 'Receita' : 'Despesa',
                category: tx.category,
                description: tx.description ?? '',
                payment: tx.paymentMethod ?? 'N/A',
                amount: Number(tx.amount),
            });

            row.getCell('amount').font = { color: { argb: tx.type === 'INCOME' ? 'FF16a34a' : 'FFdc2626' } };
        }

        const sheetCommissions = workbook.addWorksheet('Comissões');
        sheetCommissions.columns = [
            { header: 'Data', key: 'date', width: 20 },
            { header: 'Profissional', key: 'professional', width: 25 },
            { header: 'Valor (R$)', key: 'amount', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
        ];

        sheetCommissions.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheetCommissions.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };

        for (const commission of commissions) {
            sheetCommissions.addRow({
                date: new Date(commission.createdAt).toLocaleDateString('pt-BR'),
                professional: commission.professional.name,
                amount: Number(commission.amount),
                status: commission.status === 'PAID' ? 'Pago' : 'Pendente',
            });
        }

        const dateRange = `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_${dateRange}.xlsx`);

        await workbook.xlsx.write(res);
    }

    async exportToPdf(params: ExportParams, res: Response) {
        const { tenantId, start, end } = params;

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });

        const [incomeResult, expenseResult, totalAppointments, pendingCommissions, topProfessionals] =
            await Promise.all([
                prisma.transaction.aggregate({ where: { tenantId, type: 'INCOME', createdAt: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
                prisma.transaction.aggregate({ where: { tenantId, type: 'EXPENSE', createdAt: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
                prisma.appointment.count({ where: { tenantId, status: 'COMPLETED', startTime: { gte: start, lte: end } } }),
                prisma.commission.aggregate({ where: { tenantId, status: 'PENDING' }, _sum: { amount: true } }),
                prisma.commission.groupBy({
                    by: ['professionalId'],
                    where: { tenantId, createdAt: { gte: start, lte: end } },
                    _sum: { amount: true },
                    _count: { professionalId: true },
                    orderBy: { _sum: { amount: 'desc' } },
                    take: 5,
                }),
            ]);

        const profIds = topProfessionals.map(p => p.professionalId);
        const profNames = await prisma.professional.findMany({ where: { id: { in: profIds } }, select: { id: true, name: true } });

        const totalIncome = Number(incomeResult._sum.amount ?? 0);
        const totalExpense = Number(expenseResult._sum.amount ?? 0);
        const totalPending = Number(pendingCommissions._sum.amount ?? 0);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        const dateRange = `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_${dateRange}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').text('Bartime', { align: 'center' });
        doc.fontSize(14).font('Helvetica').text(tenant?.name ?? '', { align: 'center' });
        doc.fontSize(10).fillColor('#6b7280').text(
            `Período: ${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`,
            { align: 'center' }
        );

        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
        doc.moveDown(1);

        doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827').text('Resumo Financeiro');
        doc.moveDown(0.5);

        const addRow = (label: string, value: string, color = '#111827') => {
            doc.fontSize(11).font('Helvetica').fillColor('#6b7280').text(label, { continued: true });
            doc.font('Helvetica-Bold').fillColor(color).text(value, { align: 'right' });
        };

        addRow('Total de Atendimentos', String(totalAppointments));
        addRow('Faturamento Total', `R$ ${totalIncome.toFixed(2)}`, '#16a34a');
        addRow('Total de Despesas', `R$ ${totalExpense.toFixed(2)}`, '#dc2626');
        addRow('Comissões Pendentes', `R$ ${totalPending.toFixed(2)}`, '#d97706');
        addRow('Lucro Líquido', `R$ ${(totalIncome - totalExpense - totalPending).toFixed(2)}`, '#2563eb');

        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
        doc.moveDown(1);

        doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827').text('Top Profissionais');
        doc.moveDown(0.5);

        for (const prof of topProfessionals) {
            const name = profNames.find(p => p.id === prof.professionalId)?.name ?? 'Desconhecido';
            const total = Number(prof._sum.amount ?? 0).toFixed(2);
            const count = prof._count.professionalId;
            addRow(`${name} (${count} atend.)`, `R$ ${total}`);
        }

        doc.moveDown(2);
        doc.fontSize(9).fillColor('#9ca3af').text(
            `Gerado em ${new Date().toLocaleString('pt-BR')} — Bartime`,
            { align: 'center' }
        );

        doc.end();
    }
}