import { supabase } from '../config/supabase';
import * as salvyService from './salvyService';
import * as abacatePayService from './abacatePayService';
import { ADDONS } from '../config/plans';

interface CheckoutCustomer {
    name: string;
    email: string;
    cellphone: string;
    taxId: string;
}

// Valor cheio cobrado na compra do número. A Salvy cobra o mês cheio em caso de
// cancelamento, então cobrar R$ 29,90 na hora protege o ZapBroker contra prejuízo.
export const getDedicatedNumberCharge = (): number => ADDONS['dedicated_number'].price;

export const createDedicatedNumberCheckout = async (
    userId: string,
    areaCode: number,
    customer: CheckoutCustomer
) => {
    // Remove checkouts pendentes antigos do mesmo usuário (expirados/abandonados)
    await supabase
        .from('dedicated_numbers')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'pending_payment');

    const amount = getDedicatedNumberCharge();

    const { data: row, error } = await supabase
        .from('dedicated_numbers')
        .insert({
            user_id: userId,
            area_code: areaCode,
            status: 'pending_payment',
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    try {
        const charge = await abacatePayService.createPixCharge({
            subscriptionId: row.id,
            userId,
            amount,
            customer,
            extraMetadata: {
                purpose: 'dedicated_number',
                area_code: String(areaCode),
            },
        });

        await supabase
            .from('dedicated_numbers')
            .update({
                pending_checkout_id: charge.id,
                pending_checkout_qrcode: charge.brCodeBase64,
                pending_checkout_brcode: charge.brCode,
                pending_checkout_expires_at: charge.expiresAt,
            })
            .eq('id', row.id);

        return {
            id: row.id,
            amount,
            brCode: charge.brCode,
            brCodeBase64: charge.brCodeBase64,
            expiresAt: charge.expiresAt,
        };
    } catch (error: any) {
        await supabase.from('dedicated_numbers').delete().eq('id', row.id);
        throw error;
    }
};

export const checkDedicatedNumberCheckoutStatus = async (userId: string, id: string) => {
    const number = await getDedicatedNumberById(userId, id);

    if (number.status === 'active') return { status: 'active' as const, number };
    if (number.status === 'canceled') return { status: 'canceled' as const };

    if (!number.pending_checkout_id) {
        return { status: 'pending_payment' as const };
    }

    try {
        const { status } = await abacatePayService.checkPixChargeStatus(number.pending_checkout_id);
        if (status === 'PAID') {
            await activateDedicatedNumberFromPayment(id, number.pending_checkout_id);
            const activated = await getDedicatedNumberById(userId, id);
            return { status: 'active' as const, number: activated };
        }
        return { status: 'pending_payment' as const };
    } catch (error: any) {
        throw new Error('Não foi possível verificar o pagamento agora. Tente novamente em instantes.');
    }
};

// Chamado pelo webhook (transparent.completed) quando o metadado purpose=dedicated_number
// e pelo check manual "Já paguei" — cria a linha na Salvy só depois do pagamento confirmar.
export const activateDedicatedNumberFromPayment = async (id: string, paymentExternalId: string) => {
    const { data: row } = await supabase
        .from('dedicated_numbers')
        .select('*')
        .eq('id', id)
        .single();

    if (!row) throw new Error('Número dedicado não encontrado');
    if (row.status === 'active') return row;

    const salvyNumber = await salvyService.createNumber(row.area_code, 'ZapBroker dedicado');

    const { data, error } = await supabase
        .from('dedicated_numbers')
        .update({
            salvy_id: salvyNumber.id,
            phone_number: salvyNumber.phoneNumber,
            status: 'active',
            pending_checkout_id: null,
            pending_checkout_qrcode: null,
            pending_checkout_brcode: null,
            pending_checkout_expires_at: null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        // Rollback: pago mas não deu pra criar — tenta cancelar na Salvy
        try { await salvyService.cancelNumber(salvyNumber.id); } catch (e) { /* noop */ }
        throw new Error(error.message);
    }

    console.log(`Número dedicado ${id} ativado após pagamento ${paymentExternalId}`);
    return data;
};

export const getDedicatedNumbers = async (userId: string) => {
    const { data, error } = await supabase
        .from('dedicated_numbers')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'pending_payment')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
};

export const getDedicatedNumberById = async (userId: string, id: string) => {
    const { data, error } = await supabase
        .from('dedicated_numbers')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error) throw new Error('Número dedicado não encontrado');
    return data;
};

export const cancelDedicatedNumber = async (userId: string, id: string) => {
    const number = await getDedicatedNumberById(userId, id);

    // Linha pendente (nunca paga) — só remove, não há linha na Salvy para cancelar
    if (number.status === 'pending_payment') {
        await supabase.from('dedicated_numbers').delete().eq('id', id);
        return { success: true };
    }

    if (number.salvy_id) {
        try { await salvyService.cancelNumber(number.salvy_id, 'user-canceled'); } catch (e) { /* noop */ }
    }

    const { error } = await supabase
        .from('dedicated_numbers')
        .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            pending_checkout_id: null,
            pending_checkout_qrcode: null,
            pending_checkout_brcode: null,
            pending_checkout_expires_at: null,
        })
        .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
};

export const getSmsMessages = async (userId: string, id: string) => {
    const number = await getDedicatedNumberById(userId, id);

    const { data, error } = await supabase
        .from('dedicated_number_sms')
        .select('*')
        .eq('dedicated_number_id', number.id)
        .order('received_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
};

export const listAreaCodes = async () => {
    return salvyService.listAreaCodesWithAvailability();
};

// Teste de ponta a ponta no sandbox: simula um SMS chegando no número. A Salvy
// dispara o webhook sms.received, que o backend grava no banco — o SMS aparece
// no painel exatamente como em produção.
export const simulateSmsReceipt = async (userId: string, id: string, rawText: string) => {
    const number = await getDedicatedNumberById(userId, id);
    if (!number.salvy_id) {
        throw new Error('Número sem linha ativa na Salvy para simular SMS.');
    }
    if (!process.env.SALVY_API_KEY?.startsWith('salvy_test_')) {
        throw new Error('Simulação de SMS só está disponível no ambiente sandbox.');
    }
    await salvyService.simulateSms(number.salvy_id, rawText.slice(0, 160));
    return { success: true };
};