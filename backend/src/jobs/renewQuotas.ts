import cron from 'node-cron';
import { QuotaService } from '../services/quotaService';

export function startQuotaRenewalJob() {
    // Run every Monday at 00:00
    cron.schedule('0 0 * * 1', async () => {
        console.log('[CRON] Starting weekly quota renewal...');
        try {
            await QuotaService.expireOldQuotas();
            console.log('[CRON] Quota renewal completed.');
        } catch (error) {
            console.error('[CRON] Error renewing quotas:', error);
        }
    }, {
        timezone: 'America/Sao_Paulo'
    });

    console.log('[CRON] Quota renewal job scheduled (Monday 00:00 BRT)');
}
