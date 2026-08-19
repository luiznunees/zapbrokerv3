import axios from 'axios';

const ABACATE_PAY_URL = 'https://api.abacatepay.com/v2';
const ABACATE_PAY_KEY = process.env.ABACATE_PAY_KEY;

if (!ABACATE_PAY_KEY) {
    console.warn('ABACATE_PAY_KEY not configured — AbacatePay payments disabled');
}

const api = axios.create({
    baseURL: ABACATE_PAY_URL,
    headers: {
        Authorization: `Bearer ${ABACATE_PAY_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Our internal plan_id (config/plans.ts, stored in subscriptions.plan_id) points to AbacatePay
// products that were registered with cycle: 'MONTHLY'. A product with a cycle set forces
// checkout to require PIX Automático (disabled for this store) even through the one-time
// /checkouts/create endpoint — confirmed by testing directly against the API. These cycle-less
// twin products (already registered in the account) are what actually works for one-time PIX;
// map to them here only, at the AbacatePay boundary, so the internal plan_id scheme elsewhere
// (DB, frontend, limits) doesn't need to change.
const ABACATE_ONE_TIME_PRODUCT_ID: Record<string, string> = {
    'starter': 'prod_UAhRp6NYDMawr42F5mxcBwYZ', // ZapBroker - Starter
    'pro': 'prod_tBdEdYtwcHJEbdDcXYPG3TkZ', // ZapBroker - Pro
};

// ============================================================
// Transparent checkout (PIX QR code rendered on our own site — no redirect to AbacatePay)
// ============================================================

interface CreatePixChargeParams {
    subscriptionId: string;
    userId: string;
    amount: number;
    customer: {
        name: string;
        email: string;
        cellphone: string;
        taxId: string;
    };
    extraMetadata?: Record<string, string>;
}

export async function createPixCharge(
    params: CreatePixChargeParams
): Promise<{ id: string; brCode: string; brCodeBase64: string; expiresAt: string }> {
    if (!ABACATE_PAY_KEY) throw new Error('AbacatePay not configured');

    const taxId = params.customer.taxId.replace(/\D/g, '');
    if (taxId.length !== 11 && taxId.length !== 14) {
        throw new Error('CPF/CNPJ inválido: deve conter 11 ou 14 dígitos');
    }
    const cellphone = params.customer.cellphone.replace(/\D/g, '');

    const payload = {
        method: 'PIX',
        data: {
            amount: params.amount,
            externalId: params.subscriptionId,
            customer: {
                name: params.customer.name,
                email: params.customer.email,
                cellphone,
                taxId,
            },
            metadata: {
                subscription_id: params.subscriptionId,
                user_id: params.userId,
                ...(params.extraMetadata || {}),
            },
        },
    };

    try {
        const response = await api.post('/transparents/create', payload);
        const data = response.data.data;
        return { id: data.id, brCode: data.brCode, brCodeBase64: data.brCodeBase64, expiresAt: data.expiresAt };
    } catch (error: any) {
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Error creating AbacatePay PIX charge:', detail);
        throw new Error(`Failed to create PIX charge: ${detail}`);
    }
}

// Active fallback for when the webhook is slow, never arrives, or (as in local dev) simply
// can't reach us — lets "Já fiz o pagamento" ask AbacatePay directly instead of only trusting
// our own DB, which only gets updated by the webhook.
export async function checkPixChargeStatus(chargeId: string): Promise<{ status: string }> {
    if (!ABACATE_PAY_KEY) throw new Error('AbacatePay not configured');
    try {
        const response = await api.get('/transparents/check', { params: { id: chargeId } });
        return { status: response.data.data.status };
    } catch (error: any) {
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Error checking AbacatePay PIX charge status:', detail);
        throw new Error(`Failed to check PIX charge status: ${detail}`);
    }
}

// ============================================================
// One-time billing (legacy — used by existing pending payments)
// ============================================================

interface CreateBillingParams {
    subscriptionId: string;
    userId: string;
    planId: string;
    customer: {
        name: string;
        email: string;
        cellphone: string;
        taxId: string;
    };
}

export async function createBilling(
    params: CreateBillingParams,
    methods: Array<'PIX' | 'CARD'> = ['PIX']
): Promise<{ id: string; url: string }> {
    if (!ABACATE_PAY_KEY) throw new Error('AbacatePay not configured');

    const taxId = params.customer.taxId.replace(/\D/g, '');
    if (taxId.length !== 11 && taxId.length !== 14) {
        throw new Error('CPF/CNPJ inválido: deve conter 11 ou 14 dígitos');
    }
    const cellphone = params.customer.cellphone.replace(/\D/g, '');
    const abacateProductId = ABACATE_ONE_TIME_PRODUCT_ID[params.planId] || params.planId;

    const payload = {
        items: [{ id: abacateProductId, quantity: 1 }],
        methods,
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/upgrade`,
        completionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?checkout=success`,
        customer: {
            name: params.customer.name,
            email: params.customer.email,
            cellphone,
            taxId,
        },
        externalId: params.subscriptionId,
        metadata: {
            subscription_id: params.subscriptionId,
            user_id: params.userId,
        },
    };

    try {
        const response = await api.post('/checkouts/create', payload);
        return { id: response.data.data.id, url: response.data.data.url };
    } catch (error: any) {
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Error creating AbacatePay billing:', detail);
        throw new Error(`Failed to create billing: ${detail}`);
    }
}

// ============================================================
// Recurring subscription (PIX recorrente)
// ============================================================

interface CreateSubscriptionParams {
    subscriptionId: string;
    userId: string;
    planId: string;
    customer: {
        name: string;
        email: string;
        cellphone: string;
        taxId: string;
    };
}

export async function createSubscriptionCheckout(
    params: CreateSubscriptionParams
): Promise<{ id: string; url: string }> {
    if (!ABACATE_PAY_KEY) throw new Error('AbacatePay not configured');

    const taxId = params.customer.taxId.replace(/\D/g, '');
    if (taxId.length !== 11 && taxId.length !== 14) {
        throw new Error('CPF/CNPJ inválido: deve conter 11 ou 14 dígitos');
    }
    const cellphone = params.customer.cellphone.replace(/\D/g, '');

    const payload = {
        items: [{ id: params.planId, quantity: 1 }],
        methods: ['PIX'],
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/upgrade`,
        completionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?checkout=success`,
        customer: {
            name: params.customer.name,
            email: params.customer.email,
            cellphone,
            taxId,
        },
        externalId: params.subscriptionId,
        metadata: {
            subscription_id: params.subscriptionId,
            user_id: params.userId,
        },
    };

    try {
        const response = await api.post('/subscriptions/create', payload);
        return { id: response.data.data.id, url: response.data.data.url };
    } catch (error: any) {
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Error creating AbacatePay subscription:', detail);
        throw new Error(`Failed to create subscription: ${detail}`);
    }
}

export async function cancelAbacateSubscription(abacateSubscriptionId: string): Promise<void> {
    if (!ABACATE_PAY_KEY) throw new Error('AbacatePay not configured');

    try {
        await api.post('/subscriptions/cancel', { id: abacateSubscriptionId });
    } catch (error: any) {
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Error cancelling AbacatePay subscription:', detail);
        throw new Error(`Failed to cancel subscription: ${detail}`);
    }
}
