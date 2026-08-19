import { Router } from 'express';
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /push/subscribe:
 *   post:
 *     summary: Register a web push subscription for the current user
 *     tags: [Push]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint, keys]
 *             properties:
 *               endpoint: { type: string }
 *               keys:
 *                 type: object
 *                 required: [p256dh, auth]
 *                 properties:
 *                   p256dh: { type: string }
 *                   auth: { type: string }
 *     responses:
 *       200: { description: Subscribed }
 *       400: { description: Missing endpoint/keys }
 */
router.post('/subscribe', async (req: AuthRequest, res: Response) => {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ error: 'endpoint e keys (p256dh/auth) são obrigatórios' });
        }

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert(
                {
                    user_id: req.user.id,
                    endpoint,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                },
                { onConflict: 'endpoint' }
            );

        if (error) throw new Error(error.message);
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /push/unsubscribe:
 *   delete:
 *     summary: Remove a web push subscription
 *     tags: [Push]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint]
 *             properties:
 *               endpoint: { type: string }
 *     responses:
 *       200: { description: Unsubscribed }
 */
router.delete('/unsubscribe', async (req: AuthRequest, res: Response) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) return res.status(400).json({ error: 'endpoint é obrigatório' });

        await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', req.user.id)
            .eq('endpoint', endpoint);

        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;