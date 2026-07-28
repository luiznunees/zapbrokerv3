import cron from 'node-cron';
import { QuotaService } from '../services/quotaService';
import { supabase } from '../config/supabase';

export function startQuotaRenewalJob() {
    // Run on the 1st of every month at 00:00 — monthly quota renewal
    cron.schedule('0 0 1 * *', async () => {
        console.log('[CRON] Starting monthly quota renewal...');
        try {
            await QuotaService.expireOldQuotas();
            console.log('[CRON] Quota renewal completed.');
        } catch (error) {
            console.error('[CRON] Error renewing quotas:', error);
        }
    }, {
        timezone: 'America/Sao_Paulo'
    });

    // Run daily at 00:30 — expire trials
    cron.schedule('30 0 * * *', async () => {
        console.log('[CRON] Checking expired trials...');
        try {
            const { data: expired, error } = await supabase
                .from('subscriptions')
                .update({ status: 'expired', updated_at: new Date() })
                .lt('trial_ends_at', new Date())
                .eq('status', 'active')
                .select();

            if (error) console.error('[CRON] Trial expiry error:', error);
            else if (expired?.length) console.log(`[CRON] ${expired.length} trial(s) expired`);
        } catch (error) {
            console.error('[CRON] Error checking trials:', error);
        }
    }, {
        timezone: 'America/Sao_Paulo'
    });

    console.log('[CRON] Quota renewal job scheduled (1st of month 00:00 BRT)');
    console.log('[CRON] Trial expiry check scheduled (daily 00:30 BRT)');
}
