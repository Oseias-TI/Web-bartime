const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.tenant.updateMany({ data: { slug: 'barbearia-do-oseias' } });
    console.log('Slug set to barbearia-do-oseias');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
