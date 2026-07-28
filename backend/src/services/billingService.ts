import { supabase } from '../config/supabase';
import * as abacatePayService from './abacatePayService';

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
