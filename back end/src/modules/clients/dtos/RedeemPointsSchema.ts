import { z } from 'zod';

export const RedeemPointsSchema = z.object({
    points: z.number().int().positive(),
});