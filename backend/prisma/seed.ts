import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando criação de dados fakes...');

    const hashedPassword = await bcrypt.hash('Oseias123!', 10);

    const randomId = Math.floor(Math.random() * 99999);
    
    const platformTenant = await prisma.tenant.create({
        data: {
            name: `Administração Bartime`,
            slug: `admin-bartime-${randomId}`,
            cnpj: `00000000000000`,
            subscriptionStatus: 'ACTIVE',
            professionals: {
                create: {
                    name: 'Super Administrador',
                    email: 'super@bartime.com',
                    password: hashedPassword,
                    role: 'SUPER_ADMIN'
                }
            }
        }
    });
    console.log(`✅ Super Admin criado: super@bartime.com / Oseias123!`);

    const tenant = await prisma.tenant.create({
        data: {
            name: `Barbearia Vintage Fake ${randomId}`,
            slug: `barbearia-vintage-fake-${randomId}`,
            cnpj: `112223330001${String(randomId).slice(0, 2).padStart(2, '0')}`,
            subscriptionStatus: 'ACTIVE',
            professionals: {
                create: {
                    name: 'Oséias Admin',
                    email: 'oseias@bartime.com',
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            }
        }
    });
    console.log(`✅ Barbearia criada: ${tenant.name}`);

    for (let i = 0; i <= 6; i++) {
        await prisma.businessHour.create({
            data: {
                tenantId: tenant.id,
                dayOfWeek: i,
                open: i !== 0,
                openTime: '08:00',
                closeTime: '20:00'
            }
        });
    }

    const service1 = await prisma.service.create({
        data: { tenantId: tenant.id, name: 'Corte Social', price: 40.0, durationMin: 30 }
    });
    const service2 = await prisma.service.create({
        data: { tenantId: tenant.id, name: 'Barba Terapia', price: 35.0, durationMin: 30 }
    });
    console.log(`✅ Serviços criados: ${service1.name}, ${service2.name}`);

    const prof1 = await prisma.professional.create({
        data: { tenantId: tenant.id, name: 'Pedro Tesoura', email: `pedro${randomId}@fake.com`, password: hashedPassword, role: 'BARBER', commissionRate: 50.0 }
    });
    const prof2 = await prisma.professional.create({
        data: { tenantId: tenant.id, name: 'Lucas Navalha', email: `lucas${randomId}@fake.com`, password: hashedPassword, role: 'BARBER', commissionRate: 40.0 }
    });
    console.log(`✅ Profissionais criados: ${prof1.name}, ${prof2.name}`);

    const clients = [];
    for (let i = 1; i <= 5; i++) {
        const client = await prisma.client.create({
            data: { tenantId: tenant.id, name: `Cliente Fake ${i} (${randomId})`, phone: `11999${String(randomId).slice(0,4)}${i}`, email: `cliente${i}_${randomId}@fake.com` }
        });
        clients.push(client);
    }
    console.log(`✅ 5 Clientes fakes criados!`);

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
            status: 'PENDING'
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
