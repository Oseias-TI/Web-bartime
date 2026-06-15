import { PrismaClient } from '@prisma/client';
import { AppointmentService } from './modules/appointments/services/AppointmentService';

const prisma = new PrismaClient();

async function testNotification() {
    try {
        console.log('Buscando dados para o teste...');
        
        // Pega o último tenant criado
        const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'desc' } });
        if (!tenant) throw new Error('Nenhum tenant encontrado. Execute o seed primeiro.');

        // Pega um profissional
        const professional = await prisma.professional.findFirst({ where: { tenantId: tenant.id } });
        if (!professional) throw new Error('Nenhum profissional encontrado.');

        // Pega um cliente
        const client = await prisma.client.findFirst({ where: { tenantId: tenant.id } });
        if (!client) throw new Error('Nenhum cliente encontrado.');

        // Pega um serviço
        const service = await prisma.service.findFirst({ where: { tenantId: tenant.id } });
        if (!service) throw new Error('Nenhum serviço encontrado.');

        // Define a data para amanhã, às 14:00 (ajustar conforme horário de funcionamento)
        // BUG FIX LOCAL: pegando amanhã às 14:00. O tenant openTime costuma ser 09:00 e closeTime 18:00
        const date = new Date();
        date.setDate(date.getDate() + 1);
        
        // Ensure the day is not Sunday (0) or if it's Sunday, move to Monday (1) to respect business hours typically.
        if (date.getDay() === 0) date.setDate(date.getDate() + 1);

        date.setHours(14, 0, 0, 0);

        console.log(`Criando agendamento para ${client.name} com ${professional.name} no serviço ${service.name} às ${date.toISOString()}...`);

        const appointmentService = new AppointmentService();
        const appointment = await appointmentService.createAppointment({
            tenantId: tenant.id,
            clientId: client.id,
            professionalId: professional.id,
            serviceId: service.id,
            startTime: date.toISOString()
        });

        console.log('✅ Agendamento criado com sucesso!');
        console.log('Verifique o log de e-mail acima/abaixo para confirmar o envio da notificação.');

    } catch (error: any) {
        console.error('❌ Erro no teste:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

testNotification();
