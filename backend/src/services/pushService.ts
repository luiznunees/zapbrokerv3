import webpush from 'web-push';
import { supabase } from '../config/supabase';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@zapbroker.dev';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    data?: Record<string, any>;
}

export const pushEnabled = (): boolean => Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

// Envia uma notificação push para todos os dispositivos registrados de um usuário.
// Nunca lança erro — é um efeito colateral chamado de dentro de fluxos quentes
// (webhook de SMS, pagamento, campanha), e falha aqui não pode derrubar o fluxo.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!pushEnabled()) return;

    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', userId);

    if (error || !subscriptions?.length) return;

    const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || '/dashboard',
        data: payload.data || {},
    });

    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                notificationPayload
            );
            await supabase
                .from('push_subscriptions')
                .update({ last_sent_at: new Date() })
                .eq('id', sub.id);
        } catch (err: any) {
            // Endpoint expirado/removido (410 Gone, 404) — limpa o registro.
            const status = err?.statusCode;
            if (status === 404 || status === 410) {
                console.log(`[Push] Removendo subscription expirada para user ${userId}`);
                await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            } else {
                console.error(`[Push] Falha ao enviar para user ${userId}:`, err?.message || err);
            }
        }
    }
}

// Envia para vários usuários de uma vez (re-engajamento em lote).
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    for (const userId of userIds) {
        await sendPushToUser(userId, payload);
    }
}