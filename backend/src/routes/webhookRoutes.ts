import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import * as webhookController from '../controllers/webhookController';
import * as abacateWebhookController from '../controllers/abacateWebhookController';
import * as salvyWebhookController from '../controllers/salvyWebhookController';

const router = Router();

// Webhooks usually don't have our auth token, they might have a secret or just be open (with IP whitelist)
// For now, we leave it open or check a secret in headers if configured in Evolution

// Evolution/WAHA não mandam assinatura própria (diferente do Salvy/AbacatePay, que verificam
// HMAC abaixo) — hoje qualquer um na internet pode forjar "lead respondeu" chamando essas
// rotas direto. Fica opt-in (só passa a exigir quando WEBHOOK_SHARED_SECRET estiver
// configurado) pra não quebrar o webhook em produção antes de registrar o segredo na URL
// configurada no painel do Evolution/WAHA (`?secret=<valor>` ou header `x-webhook-secret`).
function verifyWebhookSecret(req: Request, res: Response, next: NextFunction) {
    const expected = process.env.WEBHOOK_SHARED_SECRET;
    if (!expected) return next();

    const provided = req.query.secret || req.headers['x-webhook-secret'];
    if (provided !== expected) {
        console.warn(`[Webhook] Secret ausente ou inválido em ${req.path}`);
        return res.status(401).send('Unauthorized');
    }
    next();
}

/**
 * @swagger
 * /webhooks/evolution:
 *   post:
 *     summary: Receive status updates from Evolution API
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/waha', verifyWebhookSecret, webhookController.handleWahaWebhook);
router.post('/evolution', verifyWebhookSecret, webhookController.handleEvolutionWebhook);

// Salvy virtual number SMS webhook (Svix) — raw body needed for signature verification
router.post('/salvy', express.raw({ type: 'application/json' }), (req, res, next) => {
    (req as any).rawBody = (req.body as Buffer).toString('utf8');
    try {
        req.body = JSON.parse((req as any).rawBody);
    } catch (err) {
        console.warn('[Webhook] Salvy payload inválido (JSON malformado):', (err as Error).message);
        return res.status(400).send('Invalid JSON payload');
    }
    next();
}, salvyWebhookController.handleSalvyWebhook);

// AbacatePay webhook with raw body for HMAC verification
router.post('/abacatepay', express.raw({ type: 'application/json' }), (req, res, next) => {
    (req as any).rawBody = (req.body as Buffer).toString('utf8');
    try {
        req.body = JSON.parse((req as any).rawBody);
    } catch (err) {
        console.warn('[Webhook] AbacatePay payload inválido (JSON malformado):', (err as Error).message);
        return res.status(400).send('Invalid JSON payload');
    }
    next();
}, abacateWebhookController.handleAbacateWebhook);



export default router;
