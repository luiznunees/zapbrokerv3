import { supabase } from '../config/supabase';
import { sendPushToUser } from './pushService';

// Re-engajamento: lembra corretores que pararam de usar o ZapBroker de voltar.
// Só envia para quem tem push_subscriptions registrada (se não tiver, não há como avisar).

export const REENGAGEMENT_MIN_INTERVAL_DAYS = 7;

// Busca usuários inativos há X dias que tenham push cadastrado e que já podem
// receber uma nova notificação (respeita last_reengagement_at).
export async function getPushSubscribedUsers(thresholdDays: number): Promise<string[]> {
    const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000).toISOString();
    const intervalCutoff = new Date(
        Date.now() - REENGAGEMENT_MIN_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
        .from('users')
        .select('id')
        .or(
            `and(last_active_at.is.null,or(last_reengagement_at.is.null,last_reengagement_at.lt.${intervalCutoff})),and(last_active_at.lt.${cutoff},or(last_reengagement_at.is.null,last_reengagement_at.lt.${intervalCutoff}))`
        );

    if (error) {
        console.error('[Reengagement] Erro ao buscar usuários inativos:', error.message);
        return [];
    }

    const ids = (data || []).map((u: any) => u.id);
    if (ids.length === 0) return [];

    // Filtra para quem realmente tem push_subscriptions
    const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .in('user_id', ids);

    if (error || !subs?.length) return [];

    const withPush = Array.from(new Set(subs.map((s: any) => s.user_id)));
    return withPush;
}

// Monta mensagens com dados reais do usuário (campanhas ativas, leads que responderam).
export async function buildReengagementPayload(userId: string): Promise<{ title: string; body: string; url: string }> {
    const [campaignsRes, repliedRes] = await Promise.all([
        supabase
            .from('campaigns')
            .select('id')
            .eq('user_id', userId)
            .in('status', ['PENDING', 'SENDING', 'ACTIVE', 'SENT']),
        supabase
            .from('campaign_messages')
            .select('id, campaign_id, campaigns!inner(user_id)')
            .eq('lead_status', 'REPLIED')
            .eq('campaigns.user_id', userId),
    ]);

    const activeCampaigns = campaignsRes.data?.length || 0;
    const repliedCount = repliedRes.data?.length || 0;

    const base = {
        title: '👋 ZapBroker sente sua falta',
        url: '/dashboard',
    };

    if (activeCampaigns > 0 && repliedCount > 0) {
        return {
            ...base,
            title: `🔥 ${repliedCount} lead(s) quente(s) te esperam!`,
            body: `${activeCampaigns} campanha(s) no ar e ${repliedCount} lead(s) já responderam. Não deixa o cliente esfriar!`,
        };
    }
    if (activeCampaigns > 0) {
        return {
            ...base,
            title: '📈 Suas campanhas seguem no ar',
            body: `Você tem ${activeCampaigns} campanha(s) em andamento. Dá uma olhada no resultado!`,
        };
    }
    if (repliedCount > 0) {
        return {
            ...base,
            title: `🔥 ${repliedCount} lead(s) quente(s)!`,
            body: 'Leads responderam suas campanhas. Corre lá e vende! 🏆',
        };
    }
    return {
        ...base,
        body: 'Suas ferramentas de disparo seguem prontas. Volta e retoma suas vendas!',
    };
}

export async function sendReengagement(thresholdDays: number): Promise<number> {
    const userIds = await getPushSubscribedUsers(thresholdDays);
    let sent = 0;

    for (const userId of userIds) {
        try {
            const payload = await buildReengagementPayload(userId);
            await sendPushToUser(userId, payload);
            await supabase
                .from('users')
                .update({ last_reengagement_at: new Date() })
                .eq('id', userId);
            sent++;
        } catch (err: any) {
            console.error(`[Reengagement] Erro ao notificar user ${userId}:`, err.message);
        }
    }

    if (sent > 0) console.log(`[Reengagement] ${sent} usuário(s) notificado(s) (inativos há ${thresholdDays}d).`);
    return sent;
}