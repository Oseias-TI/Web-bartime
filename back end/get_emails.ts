import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const clients = await prisma.client.findMany({ select: { email: true, name: true } });
    const professionals = await prisma.professional.findMany({ select: { email: true, name: true, role: true } });
    
    console.log('--- Clients ---');
    console.log(clients);
    console.log('\n--- Professionals ---');
    console.log(professionals);
}
main().finally(() => prisma.$disconnect());
