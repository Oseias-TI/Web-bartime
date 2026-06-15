import { Request, Response } from 'express';
import { StripeWebhookService } from '../services/StripeWebhookService';

export class WebhookController {
    async handle(req: Request, res: Response) {
        const signature = req.headers['stripe-signature'];
        if (!signature) return res.status(400).json({ error: 'Assinatura do webhook ausente.' });

        const service = new StripeWebhookService();
        let event;

        try {
            event = service.constructEvent(req.body as Buffer, signature as string);
        } catch (err: any) {
            console.error('[Stripe Webhook] Assinatura inválida:', err.message);
            return res.status(400).json({ error: `Webhook inválido: ${err.message}` });
        }

        try {
            await service.handleEvent(event);
            return res.json({ received: true });
        } catch (err) {
            console.error('[Stripe Webhook] Erro ao processar evento:', err);
            return res.json({ received: true, warning: 'Erro interno ao processar evento.' });
        }
    }
}