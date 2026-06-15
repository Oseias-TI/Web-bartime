import { prisma } from './src/lib/prisma';

async function findJeferson() {
    const professionals = await prisma.professional.findMany({
        where: {
            name: { contains: 'jefeson', mode: 'insensitive' }
        },
        include: { tenant: true }
    });

    if (professionals.length === 0) {
        const altProfessionals = await prisma.professional.findMany({
            where: {
                name: { contains: 'jeferson', mode: 'insensitive' }
            },
            include: { tenant: true }
        });
        console.log("Alternative professionals found:", altProfessionals);
    } else {
        console.log("Professionals found:", professionals);
    }
}

findJeferson();
