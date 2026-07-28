import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import * as eventLogService from '../services/eventLogService';

function getAbacateHmacKey(): string {
    const key = process.env.ABACATE_WEBHOOK_HMAC_KEY;
    if (!key) {
        throw new Error('ABACATE_WEBHOOK_HMAC_KEY não está configurada no ambiente');
    }
    return key;
}

function verifyAbacateSignature(rawBody: string, signatureFromHeader: string): boolean {
    const bodyBuffer = Buffer.from(rawBody, 'utf8');
    const expectedSig = crypto
        .createHmac('sha256', getAbacateHmacKey())
        .update(bodyBuffer)
        .digest('base64');
    const A = Buffer.from(expectedSig);
    const B = Buffer.from(signatureFromHeader);
    return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export const handleAbacateWebhook = async (req: Request, res: Response) => {
    try {
        const signature = req.headers['x-webhook-signature'] as string;
        const rawBody = (req as any).rawBody;

        if (signature && rawBody) {
            if (!verifyAbacateSignature(rawBody, signature)) {
                console.warn('Invalid AbacatePay HMAC signature');
                return res.status(403).send('Forbidden');
            }
        } else {
            const secret = req.query.webhookSecret || req.headers['x-webhook-secret'];
            if (secret !== process.env.ABACATE_WEBHOOK_SECRET) {
                console.warn('Invalid AbacatePay webhook secret');
                return res.status(403).send('Forbidden');
            }
        }

        const { event: eventType, data } = req.body;
        console.log('AbacatePay webhook received:', eventType);

        // ============================================================
        // Dormant: AbacatePay has no recurring PIX today, so these subscription.* events are
        // never sent for new checkouts (everything goes through checkout.completed below).
        // Kept in case recurring PIX comes back — harmless while unreachable.
        // ============================================================
        if (eventType === 'subscription.completed') {
            const sub = data?.subscription || data;
            const subscriptionId = sub?.externalId || data?.externalId || data?.metadata?.subscription_id;
            const abacateSubId = sub?.id; // subs_...

            if (subscriptionId) {
                const paymentExternalId = sub?.id || data?.id;

                await supabase
                    .from('payments')
                    .update({ status: 'PAID', method: 'PIX', updated_at: new Date() })
                    .eq('subscription_id', subscriptionId)
                    .eq('status', 'PENDING');

                const now = new Date();
                const nextBilling = new Date(now);
                nextBilling.setMonth(nextBilling.getMonth() + 1);

                const updateData: any = {
                    status: 'active',
                    start_date: now,
                    next_billing_date: nextBilling,
                    updated_at: now,
                };
                if (abacateSubId) {
                    updateData.gateway_subscription_id = abacateSubId;
                }

                await supabase
                    .from('subscriptions')
                    .update(updateData)
                    .eq('id', subscriptionId);

                console.log(`Subscription ${subscriptionId} activated (PIX recorrente). AbacatePay ID: ${abacateSubId}`);
            }

            return res.status(200).send('OK');
        }

        // ============================================================
        // Subscription renewed (recurring payment successful)
        // ============================================================
        if (eventType === 'subscription.renewed') {
            const sub = data?.subscription || data;
            const subscriptionId = sub?.externalId || data?.externalId || data?.metadata?.subscription_id;
            const abacateSubId = sub?.id;

            if (subscriptionId) {
                const paymentExternalId = data?.id || sub?.id;

                await supabase
                    .from('payments')
                    .insert({
                        subscription_id: subscriptionId,
                        external_id: paymentExternalId,
                        amount: sub?.amount || 0,
                        status: 'PAID',
                        method: 'PIX',
                    });

                const nextBilling = new Date();
                nextBilling.setMonth(nextBilling.getMonth() + 1);

                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        next_billing_date: nextBilling,
                        updated_at: new Date(),
                        ...(abacateSubId ? { gateway_subscription_id: abacateSubId } : {}),
                    })
                    .eq('id', subscriptionId);

                console.log(`Subscription ${subscriptionId} renewed via PIX recorrente.`);
            }

            return res.status(200).send('OK');
        }

        // ============================================================
        // Subscription cancelled
        // ============================================================
        if (eventType === 'subscription.cancelled') {
            const sub = data?.subscription || data;
            const subscriptionId = sub?.externalId || data?.externalId || data?.metadata?.subscription_id;

            if (subscriptionId) {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'canceled', updated_at: new Date() })
                    .eq('id', subscriptionId);

                console.log(`Subscription ${subscriptionId} cancelled via AbacatePay webhook.`);
                eventLogService.logEvent({
                    type: 'payment.cancelled',
                    severity: 'warn',
                    message: `Assinatura ${subscriptionId} cancelada via webhook AbacatePay`,
                    metadata: { subscriptionId },
                });
            }

            return res.status(200).send('OK');
        }

        // ============================================================
        // Dormant: checkout.completed was the main path while billing went through the hosted
        // /checkouts/create checkout. We've since switched to the transparent PIX checkout
        // (transparent.completed below), rendered as a QR code on our own site instead of
        // redirecting to an AbacatePay-hosted page. Kept in case that flow is ever reused.
        // ============================================================
        if (eventType === 'checkout.completed') {
            const billing = data || {};
            const metadata = billing.metadata || {};
            const subscriptionId = metadata.subscription_id || billing.externalId;
            const paymentExternalId = billing.id;

            if (subscriptionId && paymentExternalId) {
                const paidMethod = billing.methods?.[0] || 'PIX';

                await supabase
                    .from('payments')
                    .update({ status: 'PAID', method: paidMethod, updated_at: new Date() })
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
                        pending_checkout_url: null,
                        updated_at: new Date(),
                    })
                    .eq('id', subscriptionId);

                console.log(`Checkout ${paymentExternalId} paid — subscription ${subscriptionId} activated/renewed.`);
                eventLogService.logEvent({
                    type: 'payment.confirmed',
                    severity: 'info',
                    message: `Pagamento confirmado (checkout) — assinatura ${subscriptionId}`,
                    metadata: { subscriptionId, paymentExternalId },
                });
            }

            return res.status(200).send('OK');
        }

        // ============================================================
        // Main path: transparent.completed (PIX QR code rendered on our own site). Every
        // billing cycle — first payment and every monthly renewal generated by the billing
        // job — is a standalone transparent PIX charge, since AbacatePay has no recurring PIX.
        // ============================================================
        if (eventType === 'transparent.completed') {
            const charge = data || {};
            const metadata = charge.metadata || {};
            const subscriptionId = metadata.subscription_id || charge.externalId;
            const paymentExternalId = charge.id;

            if (subscriptionId && paymentExternalId) {
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
                eventLogService.logEvent({
                    type: 'payment.confirmed',
                    severity: 'info',
                    message: `Pagamento PIX confirmado — assinatura ${subscriptionId}`,
                    metadata: { subscriptionId, paymentExternalId },
                });
            }

            return res.status(200).send('OK');
        }

        // Unknown event — still acknowledge
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling AbacatePay webhook:', error);
        res.status(500).send('Internal Server Error');
    }
};
