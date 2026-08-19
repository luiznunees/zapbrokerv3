import { supabase } from '../config/supabase';
import * as abacatePayService from './abacatePayService';
import * as emailService from './emailService';
import * as eventLogService from './eventLogService';
import { sendPushToUser } from './pushService';
import { PLANS, ADDONS } from '../config/plans';

// Soma o valor de todos os add-ons ativos do usuário ao valor base do plano.
// "Número dedicado" (R$ 29,90) é cobrado por quantidade: 2 números ativos = R$ 59,80.
// Chamado pelo primeiro checkout (createSubscription) e pelas renovações mensais (monthlyBilling).
export async function getAddonsAmount(userId: string): Promise<number> {
    const { data: dedicated, error } = await supabase
        .from('dedicated_numbers')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

    if (error) {
        console.warn('[Billing] Erro ao contar dedicated_numbers:', error.message);
        return 0;
    }

    const activeCount = dedicated?.length || 0;
    return activeCount * ADDONS['dedicated_number'].price;
}

interface GenerateBillingCheckoutParams {
    subscriptionId: string;
    userId: string;
    planId: string;
    amount: number;
    customer: {
        name: string;
        email: string;
        cellphone: string;
        taxId: string;
    };
}

// AbacatePay has no recurring PIX today, so every billing cycle (first payment and every
// renewal) goes through this same transparent PIX charge — rendered as a QR code on our own
// site instead of redirecting to an AbacatePay-hosted page. Reused by paymentController (signup)
// and by the monthly billing job (renewals).
export async function generateBillingCheckout(params: GenerateBillingCheckoutParams): Promise<{
    subscriptionId: string;
    brCode: string;
    brCodeBase64: string;
    expiresAt: string;
}> {
    const charge = await abacatePayService.createPixCharge({
        subscriptionId: params.subscriptionId,
        userId: params.userId,
        amount: params.amount,
        customer: params.customer,
    });

    await supabase
        .from('payments')
        .insert({
            user_id: params.userId,
            subscription_id: params.subscriptionId,
            external_id: charge.id,
            amount: params.amount,
            status: 'PENDING',
            method: 'PIX',
        });

    await supabase
        .from('subscriptions')
        .update({
            pending_checkout_id: charge.id,
            pending_checkout_qrcode: charge.brCodeBase64,
            pending_checkout_brcode: charge.brCode,
            pending_checkout_expires_at: charge.expiresAt,
            updated_at: new Date(),
        })
        .eq('id', params.subscriptionId);

    return {
        subscriptionId: params.subscriptionId,
        brCode: charge.brCode,
        brCodeBase64: charge.brCodeBase64,
        expiresAt: charge.expiresAt,
    };
}

// Shared by the AbacatePay webhook (transparent.completed) and by the manual "Já fiz o
// pagamento" check — same activation steps either way, whichever one learns about the
// payment first.
export async function activateSubscriptionFromPayment(subscriptionId: string, paymentExternalId: string) {
    await supabase
        .from('payments')
        .update({ status: 'PAID', method: 'PIX', updated_at: new Date() })
        .eq('external_id', paymentExternalId);

    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    await supabase
        .from('subscriptions')
        .update({
            status: 'active',
            start_date: new Date(),
            next_billing_date: nextBilling,
            pending_checkout_id: null,
            pending_checkout_qrcode: null,
            pending_checkout_brcode: null,
            pending_checkout_expires_at: null,
            updated_at: new Date(),
        })
        .eq('id', subscriptionId);

    console.log(`PIX ${paymentExternalId} paid — subscription ${subscriptionId} activated/renewed.`);

    const { data: subRow } = await supabase
        .from('subscriptions')
        .select('user_id, plan_id, next_billing_date')
        .eq('id', subscriptionId)
        .maybeSingle();

    eventLogService.logEvent({
        type: 'payment.confirmed',
        severity: 'info',
        message: `Pagamento PIX confirmado — assinatura ${subscriptionId}`,
        userId: subRow?.user_id,
        metadata: { subscriptionId, paymentExternalId },
    });

    if (subRow?.user_id) {
        const { data: userRow } = await supabase.from('users').select('name, email').eq('id', subRow.user_id).maybeSingle();
        const plan = subRow.plan_id ? PLANS[subRow.plan_id] : undefined;
        if (userRow?.email && plan) {
            emailService.sendPaymentConfirmedEmail(
                userRow.email,
                userRow.name || 'corretor(a)',
                plan.name,
                plan.price,
                new Date(subRow.next_billing_date)
            ).catch(err => console.error('[BillingService] Failed to send payment confirmed email:', err.message));
        }

        // Notificação push — recibo na hora no celular.
        sendPushToUser(subRow.user_id, {
            title: '✅ Pagamento confirmado!',
            body: 'Pix aprovado e tudo certo por aqui. Bora disparar no automático 🚀',
            url: '/dashboard',
        }).catch(err => console.error('[BillingService] Push error:', err.message));
    }
}
