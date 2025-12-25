import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import * as abacatePayService from '../services/abacatePayService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AppError } from '../utils/AppError';

const PLANS: any = {
    'prod_AXPStPBEeB5xrpubKyWB6EnY': { name: 'ZapBroker - Pro', price: 11900 },
    'prod_n6CMApuNhHqPCUrL2JmHyWbz': { name: 'ZapBroker - Plus', price: 6900 },
    'prod_ZxwseRQWbKLxHKsnfcUCMfYc': { name: 'ZapBroker - Básico', price: 2900 }
};

export const createSubscription = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { planId } = req.body;

    if (!userId) throw new AppError('User not authenticated', 401);
    if (!PLANS[planId]) throw new AppError('Invalid plan ID', 400);

    const user = req.user;
    if (!user) throw new AppError('User not authenticated', 401);
    if (!PLANS[planId]) throw new AppError('Invalid plan ID', 400);

    const plan = PLANS[planId];

    // 1. Create Subscription Record (Pending)
    const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
            user_id: userId,
            plan_id: planId,
            status: 'pending_payment'
        })
        .select()
        .single();

    if (subError) throw new AppError('Database Error: ' + subError.message, 500);

    // 2. Create Billing Session (Hosted Checkout)
    try {
        const session = await abacatePayService.createBillingSession({
            frequency: 'ONE_TIME',
            methods: ['PIX'],
            products: [{
                // IMPORTANT: We use subscription.id here so we can identify the payment in the webhook
                externalId: subscription.id,
                name: plan.name,
                price: plan.price,
                quantity: 1
            }],
            returnUrl: `${process.env.FRONTEND_URL || 'https://zapbroker.dev'}/dashboard`,
            completionUrl: `${process.env.FRONTEND_URL || 'https://zapbroker.dev'}/dashboard/success`,
            // Omit customer object to allow user to fill everything manually at checkout
            metadata: {
                subscription_id: subscription.id
            }
        });

        // 3. Create Payment Record (Pending)
        await supabase
            .from('payments')
            .insert({
                user_id: userId,
                subscription_id: subscription.id,
                external_id: session.id,
                amount: plan.price,
                status: 'PENDING',
                method: 'PIX',
                metadata: {
                    billing_url: session.url,
                    billing_id: session.id
                }
            });

        res.status(201).json({
            subscriptionId: subscription.id,
            checkoutUrl: session.url
        });

    } catch (error: any) {
        console.error('Billing Session failure:', error.message);
        throw new AppError(error.message, 500);
    }
};

export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error || !subscription) {
        throw new AppError('Subscription not found', 404);
    }

    res.json({ status: subscription.status });
};
