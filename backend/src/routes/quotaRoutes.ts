import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/authMiddleware';
import { QuotaService } from '../services/quotaService';
import { supabase } from '../config/supabase';

const router = Router();

router.use(authenticateToken);

router.get('/current', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        // Get Plan ID
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        const planId = subscription?.plan_id || 'free'; // Handle no plan

        const quota = await QuotaService.getCurrentQuota(userId, planId);
        const weekRange = QuotaService.getCurrentWeekRange();

        res.json({
            plan: planId,
            week: {
                start: quota.week_start,
                end: quota.week_end,
                number: weekRange.weekNumber,
                year: weekRange.year
            },
            quota: {
                limit: quota.plan_limit,
                used: quota.messages_used,
                remaining: quota.messages_remaining,
                percentage: ((quota.messages_used / quota.plan_limit) * 100).toFixed(1)
            },
            renewsAt: `${quota.week_end} 23:59:59`
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/history', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const history = await QuotaService.getUsageHistory(userId);
        res.json({ history });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
