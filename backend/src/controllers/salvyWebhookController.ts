import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { supabase } from '../config/supabase';
import { getIO } from '../services/socketService';
import { sendPushToUser } from '../services/pushService';

export const handleSalvyWebhook = async (req: Request, res: Response) => {
    try {
        const rawBody = (req as any).rawBody as string | undefined;
        const signingSecret = process.env.SALVY_WEBHOOK_SIGNING_SECRET;

        if (signingSecret && rawBody) {
            const headers = req.headers as Record<string, string>;
            const wh = new Webhook(signingSecret);
            try {
                wh.verify(rawBody, headers);
            } catch (err) {
                console.warn('[SalvyWebhook] Assinatura inválida:', (err as Error).message);
                return res.status(403).send('Forbidden');
            }
        } else if (!signingSecret) {
            console.warn('[SalvyWebhook] SALVY_WEBHOOK_SIGNING_SECRET não configurado — pulando verificação de assinatura');
        } else {
            console.warn('[SalvyWebhook] rawBody indisponível — pulando verificação de assinatura');
        }

        const { type, timestamp, data } = req.body;

        if (type !== 'sms.received') {
            return res.status(200).send('OK');
        }

        const { id, phoneAccountId, virtualPhoneAccountId, receivedAt, destinationPhoneNumber, message, detections } = data || {};

        const salvyId = phoneAccountId || virtualPhoneAccountId;

        // Localiza o número dedicado pela linha Salvy
        let { data: dedicatedNumber } = await supabase
            .from('dedicated_numbers')
            .select('*')
            .eq('salvy_id', salvyId)
            .maybeSingle();

        // Fallback: busca por número de destino (E.164)
        if (!dedicatedNumber && destinationPhoneNumber) {
            ({ data: dedicatedNumber } = await supabase
                .from('dedicated_numbers')
                .select('*')
                .eq('phone_number', destinationPhoneNumber)
                .maybeSingle());
        }

        if (!dedicatedNumber) {
            console.warn(`[SalvyWebhook] Número dedicado não encontrado para Salvy id ${salvyId}`);
            return res.status(200).send('OK');
        }

        const verificationCode = detections?.whatsapp?.verificationCode || null;

        const { data: smsRow, error } = await supabase
            .from('dedicated_number_sms')
            .insert({
                dedicated_number_id: dedicatedNumber.id,
                salvy_sms_id: id,
                body: message || '',
                origin: data?.originPhoneNumber || null,
                verification_code: verificationCode,
                received_at: receivedAt || timestamp || new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('[SalvyWebhook] Erro ao gravar SMS:', error.message);
            return res.status(500).send('Error saving SMS');
        }

        try {
            const io = getIO();
            io.to(`dedicated:${dedicatedNumber.id}`).emit('sms.received', smsRow);
        } catch (e) {
            console.error('[SalvyWebhook] Socket emit error:', e);
        }

        // Notificação push no celular — o evento mais esperado pelo corretor.
        const codeText = verificationCode ? `Código: ${verificationCode}` : 'SMS recebido';
        sendPushToUser(dedicatedNumber.user_id, {
            title: '📲 Seu código de confirmação chegou!',
            body: `${codeText} — corre e cola antes que ele expire 🏃`,
            url: '/dashboard/connection',
        }).catch(err => console.error('[SalvyWebhook] Push error:', err));

        res.status(200).send('OK');
    } catch (error: any) {
        console.error('[SalvyWebhook] Error:', error.message);
        res.status(500).send('Error processing webhook');
    }
};