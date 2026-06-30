import { ClientService } from '../../../../../src/modules/clients/services/ClientService';
import { prisma } from '../../../../../src/lib/prisma';
import { redisClient } from '../../../../../src/lib/redis';
import { AppError } from '../../../../../src/shared/errors/AppError';

jest.mock('../../../../../src/lib/prisma', () => ({
    prisma: {
        client: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

jest.mock('../../../../../src/lib/redis', () => ({
    redisClient: {
        del: jest.fn(),
        isReady: false,
    },
}));

describe('CreateClientService (Unit)', () => {
    let clientService: ClientService;

    beforeEach(() => {
        clientService = new ClientService();
        jest.clearAllMocks();
    });

    it('deve criar um cliente quando dados validos forem enviados', async () => {
        const clientData = {
            tenantId: 'tenant-123',
            name: 'Cliente Novo',
            phone: '11999999999',
            preferences: 'Prefere corte com tesoura',
        };

        const createdClient = { id: 'client-123', ...clientData };

        (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.client.create as jest.Mock).mockResolvedValue(createdClient);

        const result = await clientService.createClient(clientData);

        expect(prisma.client.findUnique).toHaveBeenCalledWith({
            where: { tenantId_phone: { tenantId: clientData.tenantId, phone: clientData.phone } },
        });
        expect(prisma.client.create).toHaveBeenCalledWith({ data: clientData });
        expect(result).toEqual(createdClient);
    });

    it('nao deve criar um cliente quando o telefone ja estiver em uso', async () => {
        const clientData = {
            tenantId: 'tenant-123',
            name: 'Cliente Duplicado',
            phone: '11999999999',
        };

        (prisma.client.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-client' });

        await expect(clientService.createClient(clientData)).rejects.toBeInstanceOf(AppError);
        expect(prisma.client.create).not.toHaveBeenCalled();
    });
});
