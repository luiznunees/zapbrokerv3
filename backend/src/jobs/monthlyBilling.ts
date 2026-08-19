import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { PLANS } from '../config/plans';
import * as billingService from '../services/billingService';
import * as emailService from '../services/emailService';
import { sendPushToUser } from '../services/pushService';

// AbacatePay has no recurring PIX today, so renewals are manual: a few days before
// next_billing_date we generate a fresh one-time checkout and remind the customer to pay it;
// if it's still unpaid past the grace period, access is cut by flipping status to 'overdue'
// (checkQuota only allows 'active').
const REMINDER_DAYS_BEFORE_DUE = 3;
const GRACE_PERIOD_DAYS_AFTER_DUE = 3;

async function generateUpcomingBillings() {
    const windowEnd = new Date(Date.now() + REMINDER_DAYS_BEFORE_DUE * 24 * 60 * 60 * 1000);

    const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan_id, pix_cpf, pix_cellphone, next_billing_date')
        .eq('status', 'active')
        .is('pending_checkout_id', null)
        .lte('next_billing_date', windowEnd.toISOString());

    if (error) {
        console.error('[MonthlyBilling] Error fetching subscriptions due soon:', error.message);
        return;
    }
    if (!subscriptions?.length) return;

    for (const sub of subscriptions) {
        const plan = PLANS[sub.plan_id];
        if (!plan) {
            console.warn(`[MonthlyBilling] Unknown plan_id ${sub.plan_id} for subscription ${sub.id}, skipping.`);
            continue;
        }
        if (!sub.pix_cpf || !sub.pix_cellphone) {
            console.warn(`[MonthlyBilling] Subscription ${sub.id} has no CPF/cellphone on file, cannot generate PIX.`);
            continue;
        }

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', sub.user_id)
            .single();

        if (userError || !user) {
            console.warn(`[MonthlyBilling] Could not load user ${sub.user_id} for subscription ${sub.id}, skipping.`);
            continue;
        }

        try {
            const addonsAmount = await billingService.getAddonsAmount(sub.user_id);
            await billingService.generateBillingCheckout({
                subscriptionId: sub.id,
                userId: sub.user_id,
                planId: sub.plan_id,
                amount: plan.price + addonsAmount,
                customer: {
                    name: user.name,
                    email: user.email,
                    cellphone: sub.pix_cellphone,
                    taxId: sub.pix_cpf,
                },
            });

            await supabase
                .from('subscriptions')
                .update({ last_reminder_sent_at: new Date() })
                .eq('id', sub.id);

            // The QR code itself lives on our own checkout page now (no external checkout URL
            // to send) — the reminder just links there; the page loads the already-generated
            // pending_checkout_* fields instead of creating a new charge for the same cycle.
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const renewalUrl = `${frontendUrl}/checkout/redirect?planId=${sub.plan_id}&subscriptionId=${sub.id}`;
            await emailService.sendPaymentReminderEmail(user.email, user.name, renewalUrl);

            sendPushToUser(sub.user_id, {
                title: '⏰ Sua renovação vence em breve',
                body: 'Pague o PIX e continue no piloto automático. Seus leads não esperam!',
                url: `/checkout/redirect?planId=${sub.plan_id}&subscriptionId=${sub.id}`,
            }).catch(err => console.error('[MonthlyBilling] Push error:', err.message));

            console.log(`[MonthlyBilling] Generated renewal checkout for subscription ${sub.id}.`);
        } catch (err: any) {
            console.error(`[MonthlyBilling] Failed to generate renewal checkout for subscription ${sub.id}:`, err.message);
        }
    }
}

async function markOverdueSubscriptions() {
    const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS_AFTER_DUE * 24 * 60 * 60 * 1000);

    const { data: overdue, error } = await supabase
        .from('subscriptions')
        .update({ status: 'overdue', updated_at: new Date() })
        .eq('status', 'active')
        .lt('next_billing_date', cutoff.toISOString())
        .select('id, user_id, plan_id');

    if (error) {
        console.error('[MonthlyBilling] Error marking overdue subscriptions:', error.message);
        return;
    }
    if (!overdue?.length) return;

    console.log(`[MonthlyBilling] ${overdue.length} subscription(s) marked overdue.`);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    for (const sub of overdue) {
        const { data: user } = await supabase.from('users').select('name, email').eq('id', sub.user_id).maybeSingle();
        if (!user?.email) continue;

        const checkoutUrl = `${frontendUrl}/checkout/redirect?planId=${sub.plan_id}&subscriptionId=${sub.id}`;
        emailService.sendSubscriptionOverdueEmail(user.email, user.name || 'corretor(a)', checkoutUrl)
            .catch(err => console.error(`[MonthlyBilling] Failed to send overdue email for subscription ${sub.id}:`, err.message));

        sendPushToUser(sub.user_id, {
            title: '🚨 Atenção: acesso suspenso',
            body: 'Sua renovação venceu e o ZapBroker está parado. Pague o PIX e volte a vender!',
            url: `/checkout/redirect?planId=${sub.plan_id}&subscriptionId=${sub.id}`,
        }).catch(err => console.error('[MonthlyBilling] Overdue push error:', err.message));
    }
}

export function startMonthlyBillingJob() {
    // Once a day — generate upcoming PIX renewals and cut access for unpaid overdue ones
    cron.schedule('0 6 * * *', async () => {
        try {
            await generateUpcomingBillings();
            await markOverdueSubscriptions();
        } catch (error) {
            console.error('[MonthlyBilling] Error running monthly billing job:', error);
        }
    }, { timezone: 'America/Sao_Paulo' });

    console.log('[CRON] Monthly PIX billing job scheduled (daily 06:00 BRT)');
}
