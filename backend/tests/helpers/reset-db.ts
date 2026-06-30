import { prisma } from '../../src/lib/prisma';

afterAll(async () => {
    await prisma.$disconnect();
});

export const resetDb = async () => {
    await prisma.appointmentReminder.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.commission.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.service.deleteMany();
    await prisma.client.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.professional.deleteMany();
    await prisma.businessHour.deleteMany();
    await prisma.tenant.deleteMany();
};
