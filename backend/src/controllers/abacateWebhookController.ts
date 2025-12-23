import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const handleAbacateWebhook = async (req: Request, res: Response) => {
    try {
        const secret = req.query.webhookSecret;
        console.log('Webhook Query Params:', req.query); // Debugging

        if (secret !== process.env.ABACATE_WEBHOOK_SECRET) {
            console.warn(`Invalid AbacatePay Webhook Secret. Expected: ${process.env.ABACATE_WEBHOOK_SECRET}, Got: ${secret}`);
            return res.status(403).send('Forbidden');
        }

        const event = req.body;

        console.log('AbacatePay Webhook Received:', JSON.stringify(event, null, 2));

        const { event: eventType, data } = event;

        if (eventType === 'pix.paid' || eventType === 'billing.paid') {
            // Support both 'bill' and 'billing' naming conventions found in different versions/events
            const billingObj = data.billing || data.bill;
            const pixObj = data.pixQrCode;

            // Metadata can be in different places depending on the event
            const metadata = data.metadata || billingObj?.metadata || pixObj?.metadata;

            // Try to find subscriptionId in metadata or from product externalId
            let subscriptionId = metadata?.subscription_id;

            if (!subscriptionId) {
                // Fallback: check products externalId (where we also store it now)
                const products = data.products || billingObj?.products || pixObj?.products;
                if (Array.isArray(products) && products.length > 0) {
                    subscriptionId = products[0].externalId;
                }
            }

            const paymentId = data.id || billingObj?.id || pixObj?.id; // External ID

            if (subscriptionId) {
                // 1. Update Payment Status
                await supabase
                    .from('payments')
                    .update({
                        status: 'PAID',
                        updated_at: new Date(),
                        metadata: { ...metadata, webhook_received_at: new Date() }
                    })
                    .eq('external_id', paymentId);

                // 2. Update Subscription Status & Next Billing Date
                const nextBilling = new Date();
                nextBilling.setDate(nextBilling.getDate() + 30); // +30 days

                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        start_date: new Date(),
                        next_billing_date: nextBilling,
                        updated_at: new Date()
                    })
                    .eq('id', subscriptionId);

                console.log(`Subscription ${subscriptionId} activated.`);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling AbacatePay webhook:', error);
        res.status(500).send('Internal Server Error');
    }
};
