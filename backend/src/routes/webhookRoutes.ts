import { Router } from 'express';
import express from 'express';
import * as webhookController from '../controllers/webhookController';
import * as abacateWebhookController from '../controllers/abacateWebhookController';

const router = Router();

// Webhooks usually don't have our auth token, they might have a secret or just be open (with IP whitelist)
// For now, we leave it open or check a secret in headers if configured in Evolution

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
router.post('/waha', webhookController.handleWahaWebhook);
router.post('/evolution', webhookController.handleEvolutionWebhook);

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
