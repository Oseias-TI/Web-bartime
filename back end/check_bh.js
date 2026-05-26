const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const bh = await prisma.businessHour.findMany();
    console.log(bh);
    const profs = await prisma.professional.findMany();
    console.log("Profs:", profs.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
