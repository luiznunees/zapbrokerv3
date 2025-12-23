import { Router } from 'express';
import * as webhookController from '../controllers/webhookController';

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

import * as abacateWebhookController from '../controllers/abacateWebhookController';
router.post('/abacate', abacateWebhookController.handleAbacateWebhook);

export default router;
