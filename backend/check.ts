import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const clients = await prisma.client.findMany();
    console.log(clients);
}
main().finally(() => prisma.$disconnect());
