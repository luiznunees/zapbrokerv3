import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import * as abacatePayService from '../services/abacatePayService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AppError } from '../utils/AppError';

const PLANS: any = {
    'prod_AXPStPBEeB5xrpubKyWB6EnY': { name: 'ZapBroker - Pro', price: 11990 },
    'prod_n6CMApuNhHqPCUrL2JmHyWbz': { name: 'ZapBroker - Plus', price: 6990 },
    'prod_ZxwseRQWbKLxHKsnfcUCMfYc': { name: 'ZapBroker - Basico', price: 2990 }
};

export const createSubscription = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { planId, customer } = req.body;

    if (!userId) throw new AppError('User not authenticated', 401);
    if (!PLANS[planId]) throw new AppError('Invalid plan ID', 400);
    if (!customer || !customer.taxId) throw new AppError('Customer details (taxId) required', 400);

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

    if (subError) {
        console.error('Database Error (Create Subscription):', subError);
        throw new AppError('Failed to create subscription record: ' + subError.message, 500);
    }

    // 2. Generate PIX QR Code via AbacatePay
    try {
        const pixData = await abacatePayService.createPixQrCode({
            amount: plan.price,
            description: `Assinatura ${plan.name}`,
            customer: {
                name: customer.name,
                cellphone: customer.cellphone,
                email: customer.email,
                taxId: customer.taxId
            },
            metadata: {
                subscription_id: subscription.id,
                user_id: userId
            }
        });

        // 3. Create Payment Record
        await supabase.from('payments').insert({
            user_id: userId,
            subscription_id: subscription.id,
            external_id: pixData.id,
            amount: plan.price,
            status: 'PENDING',
            method: 'PIX',
            metadata: pixData
        });

        res.status(201).json({
            subscriptionId: subscription.id,
            pix: pixData // Contains brCode (Copy & Paste) and brCodeBase64 (QR Image)
        });

    } catch (error: any) {
        console.error('Payment creation failed:', error);
        // Rollback subscription if possible or just leave it as pending/failed
        throw new AppError(error.message || 'Failed to generate payment', 500);
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
