import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando criação de dados fakes...');

    const hashedPassword = await bcrypt.hash('Senha123!', 10);

    const randomId = Math.floor(Math.random() * 99999);
    
    // 1. Criar um Tenant (Barbearia Fake)
    const tenant = await prisma.tenant.create({
        data: {
            name: `Barbearia Vintage Fake ${randomId}`,
            cnpj: `112223330001${String(randomId).slice(0, 2).padStart(2, '0')}`,
            subscriptionStatus: 'ACTIVE',
            professionals: {
                create: {
                    name: 'Admin Supremo',
                    email: `admin.fake${randomId}@teste.com`,
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            }
        }
    });
    console.log(`✅ Barbearia criada: ${tenant.name}`);

    // 2. Criar Horários de Funcionamento
    for (let i = 0; i <= 6; i++) {
        await prisma.businessHour.create({
            data: {
                tenantId: tenant.id,
                dayOfWeek: i,
                open: i !== 0, // Fecha domingo (0)
                openTime: '08:00',
                closeTime: '20:00'
            }
        });
    }

    // 3. Criar Serviços Fakes
    const service1 = await prisma.service.create({
        data: { tenantId: tenant.id, name: 'Corte Social', price: 40.0, durationMin: 30 }
    });
    const service2 = await prisma.service.create({
        data: { tenantId: tenant.id, name: 'Barba Terapia', price: 35.0, durationMin: 30 }
    });
    console.log(`✅ Serviços criados: ${service1.name}, ${service2.name}`);

    // 4. Criar Profissionais Fakes
    const prof1 = await prisma.professional.create({
        data: { tenantId: tenant.id, name: 'Pedro Tesoura', email: `pedro${randomId}@fake.com`, password: hashedPassword, role: 'BARBER', commissionRate: 50.0 }
    });
    const prof2 = await prisma.professional.create({
        data: { tenantId: tenant.id, name: 'Lucas Navalha', email: `lucas${randomId}@fake.com`, password: hashedPassword, role: 'BARBER', commissionRate: 40.0 }
    });
    console.log(`✅ Profissionais criados: ${prof1.name}, ${prof2.name}`);

    // 5. Criar Clientes Fakes
    const clients = [];
    for (let i = 1; i <= 5; i++) {
        const client = await prisma.client.create({
            data: { tenantId: tenant.id, name: `Cliente Fake ${i} (${randomId})`, phone: `11999${String(randomId).slice(0,4)}${i}`, email: `cliente${i}_${randomId}@fake.com` }
        });
        clients.push(client);
    }
    console.log(`✅ 5 Clientes fakes criados!`);

    // 6. Criar Agendamentos Fakes
    const today = new Date();
    await prisma.appointment.create({
        data: {
            tenantId: tenant.id,
            clientId: clients[0].id,
            professionalId: prof1.id,
            serviceId: service1.id,
            startTime: new Date(today.setHours(10, 0, 0, 0)),
            endTime: new Date(today.setHours(10, 30, 0, 0)),
            status: 'COMPLETED'
        }
    });

    await prisma.appointment.create({
        data: {
            tenantId: tenant.id,
            clientId: clients[1].id,
            professionalId: prof2.id,
            serviceId: service2.id,
            startTime: new Date(today.setHours(14, 0, 0, 0)),
            endTime: new Date(today.setHours(14, 30, 0, 0)),
            status: 'SCHEDULED'
        }
    });
    console.log(`✅ Agendamentos fakes gerados!`);

    console.log('🎉 Seed finalizado com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
