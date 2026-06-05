import { prisma } from '../../src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export const tenantFactory = {
    async create(overrides = {}) {
        return prisma.tenant.create({
            data: {
                name: 'Barbearia Teste',
                cnpj: `00.000.000/${Math.floor(1000 + Math.random() * 9000)}-00`,
                subscriptionStatus: 'ACTIVE',
                ...overrides,
            },
        });
    }
};

export const clientFactory = {
    async create(tenantId: string, overrides = {}) {
        return prisma.client.create({
            data: {
                tenantId,
                name: 'Cliente Teste',
                phone: `1199999${Math.floor(1000 + Math.random() * 9000)}`,
                email: `teste_${uuidv4().substring(0, 8)}@teste.com`,
                ...overrides,
            },
        });
    },

    build(tenantId: string, overrides = {}) {
        return {
            tenantId,
            name: 'Cliente Teste',
            phone: `1199999${Math.floor(1000 + Math.random() * 9000)}`,
            email: `teste_${uuidv4().substring(0, 8)}@teste.com`,
            ...overrides,
        };
    }
};
