import { prisma } from './src/lib/prisma';

async function fixSlugs() {
  const tenants = await prisma.tenant.findMany({ where: { slug: null } });
  for (const tenant of tenants) {
    let baseSlug = tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = 'barbearia';
    let slug = baseSlug;
    let slugCounter = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { slug }
    });
    console.log(`Updated tenant ${tenant.name} with slug: ${slug}`);
  }
}

fixSlugs().catch(console.error);
