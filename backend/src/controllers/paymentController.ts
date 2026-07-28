import { Response } from 'express';
import { supabase } from '../config/supabase';
import * as billingService from '../services/billingService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AppError } from '../utils/AppError';
import { PLANS } from '../config/plans';

// AbacatePay errors come back as raw API JSON — never show that to the end user.
// Map the cases we know about to plain-language messages; anything unrecognized
// falls back to a generic "try again or contact support" message.
function friendlyBillingError(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('taxid') || lower.includes('cpf') || lower.includes('cnpj')) {
        return 'CPF ou CNPJ inválido. Verifique os números digitados e tente novamente.';
    }
    if (lower.includes('cellphone') || lower.includes('phone')) {
        return 'Número de celular inválido. Verifique e tente novamente.';
    }
    if (lower.includes('email')) {
        return 'Email inválido. Verifique e tente novamente.';
    }
    return 'Não foi possível gerar o pagamento agora. Tente novamente em instantes ou fale com o suporte.';
}

export const createSubscription = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { planId, cpf, cellphone } = req.body;

    if (!userId) throw new AppError('User not authenticated', 401);
    if (!PLANS[planId]) throw new AppError('Invalid plan ID', 400);
    if (!cpf || !cellphone) throw new AppError('CPF e telefone são obrigatórios para pagamento via PIX', 400);

    const plan = PLANS[planId];
    const user = req.user;

    const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
            user_id: userId,
            plan_id: planId,
            status: 'pending_payment',
            pix_cpf: cpf,
            pix_cellphone: cellphone,
        })
        .select()
        .single();

    if (subError) throw new AppError('Database Error: ' + subError.message, 500);

    try {
        // AbacatePay has no recurring PIX today — every cycle (this first payment included)
        // is a one-time checkout; the monthly billing job generates the same kind of checkout
        // for renewals via billingService.generateBillingCheckout.
        const { brCode, brCodeBase64, expiresAt } = await billingService.generateBillingCheckout({
            subscriptionId: subscription.id,
            userId,
            planId,
            amount: plan.price,
            customer: {
                name: user.nome || user.email,
                email: user.email,
                cellphone,
                taxId: cpf,
            },
        });

        res.status(201).json({
            subscriptionId: subscription.id,
            brCode,
            brCodeBase64,
            expiresAt,
        });
    } catch (error: any) {
        console.error('AbacatePay billing failure:', error.message);

        // The subscription row above was only a placeholder for the checkout we just failed
        // to create — leaving it as 'pending_payment' would orphan it in the database and
        // could confuse a retry later, so clean it up before reporting the error.
        await supabase.from('subscriptions').delete().eq('id', subscription.id);

        throw new AppError(friendlyBillingError(error.message), 502);
    }
};

export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('status, trial_ends_at, pending_checkout_brcode, pending_checkout_qrcode, pending_checkout_expires_at')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error || !subscription) {
        throw new AppError('Subscription not found', 404);
    }

    res.json({
        status: subscription.status,
        trial_ends_at: subscription.trial_ends_at,
        brCode: subscription.pending_checkout_brcode,
        brCodeBase64: subscription.pending_checkout_qrcode,
        expiresAt: subscription.pending_checkout_expires_at,
    });
};

export const cancelSubscription = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    if (!sub) throw new AppError('No active subscription found', 404);

    // No gateway-side subscription to cancel in the manual PIX model — each billing cycle is
    // just a standalone checkout, so cancelling only means we stop generating new ones.
    await supabase
        .from('subscriptions')
        .update({
            status: 'canceled',
            pending_checkout_id: null,
            pending_checkout_url: null,
            pending_checkout_qrcode: null,
            pending_checkout_brcode: null,
            pending_checkout_expires_at: null,
            updated_at: new Date(),
        })
        .eq('id', sub.id);

    res.json({ message: 'Subscription canceled. Access until end of billing period.' });
};
