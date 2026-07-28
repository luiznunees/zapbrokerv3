import cron from 'node-cron';
import { supabase } from '../config/supabase';

const PENDING_PAYMENT_TIMEOUT_HOURS = 24;

async function expireStalePendingSubscriptions() {
    const cutoff = new Date(Date.now() - PENDING_PAYMENT_TIMEOUT_HOURS * 60 * 60 * 1000);

    const { data: expired, error } = await supabase
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date() })
        .eq('status', 'pending_payment')
        .lt('created_at', cutoff.toISOString())
        .select();

    if (error) console.error('[CRON] Error expiring stale subscriptions:', error.message);
    else if (expired?.length) console.log(`[CRON] ${expired.length} pending subscription(s) expired`);

    const { data: expiredPayments, error: paymentsError } = await supabase
        .from('payments')
        .update({ status: 'EXPIRED', updated_at: new Date() })
        .eq('status', 'PENDING')
        .lt('created_at', cutoff.toISOString())
        .select();

    if (paymentsError) console.error('[CRON] Error expiring stale payments:', paymentsError.message);
    else if (expiredPayments?.length) console.log(`[CRON] ${expiredPayments.length} pending payment(s) expired`);
}

export function startSubscriptionRenewalJob() {
    // Every hour — expire subscriptions/payments stuck unpaid past the timeout
    cron.schedule('0 * * * *', async () => {
        try {
            await expireStalePendingSubscriptions();
        } catch (error) {
            console.error('[CRON] Error expiring stale subscriptions/payments:', error);
        }
    }, { timezone: 'America/Sao_Paulo' });

    console.log('[CRON] Stale PIX expiry check scheduled (hourly) — renewals managed by AbacatePay');
}
