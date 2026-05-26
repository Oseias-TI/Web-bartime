import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function createTestAccount() {
    try {
        console.log('Gerando conta de teste...');
        
        const cnpj = Date.now().toString().padEnd(14, '0').slice(0, 14);
        const passwordHash = await bcrypt.hash('Oseias123!', 10);
        
        const tenant = await prisma.tenant.create({
            data: { 
                name: 'Barbearia do Oseias', 
                cnpj, 
                subscriptionStatus: 'TRIAL' 
            },
        });
        
        const admin = await prisma.professional.create({
            data: {
                tenantId: tenant.id,
                name: 'Oseias Admin',
                email: 'oseias@barberflow.com',
                password: passwordHash,
                role: 'ADMIN',
                emailVerified: true, // Já deixei verificado pra você
            },
        });

        console.log('====================================');
        console.log('✅ Conta criada com sucesso!');
        console.log('🏢 Empresa: Barbearia do Oseias');
        console.log('📧 E-mail: oseias@barberflow.com');
        console.log('🔑 Senha: Oseias123!');
        console.log('====================================');
    } catch (error) {
        console.error('Erro ao criar conta:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestAccount();
