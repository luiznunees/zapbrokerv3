import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { getCostSummary } from './costService';
import { USD_TO_BRL } from '../config/aiPricing';

const PLAN_LABELS: Record<string, string> = {
    'starter': 'Starter',
    'pro': 'Pro',
};

export const getSystemStats = async () => {
    // 1. Total Users
    const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    // 2. Active Instances
    const { count: instanceCount } = await supabase
        .from('instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'connected');

    // 3. Message Stats (Today) - Assuming 'messages' table has created_at
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: messagesToday } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

    // 4. Error Count (Instances in error state)
    const { count: errorCount } = await supabase
        .from('instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error');

    // 5. Eventos error/critical das últimas 24h (ver system_events / eventLogService)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCriticalEvents } = await supabase
        .from('system_events')
        .select('*', { count: 'exact', head: true })
        .in('severity', ['error', 'critical'])
        .gte('created_at', dayAgo);

    return {
        users: userCount || 0,
        activeInstances: instanceCount || 0,
        messagesToday: messagesToday || 0,
        activeErrors: errorCount || 0,
        recentCriticalEvents: recentCriticalEvents || 0,
    };
};

export const getUsers = async (page = 1, limit = 20, search = '') => {
    let query = supabase
        .from('users')
        .select(`
            *,
            instances(count),
            subscriptions(plan_id, status)
        `)
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    return {
        // `password` é coluna legada (auth real é o Supabase Auth) — nunca vai pro cliente.
        data: data.map(({ password: _password, ...u }: any) => ({
            ...u,
            instanceCount: u.instances?.[0]?.count || 0,
            plan: u.subscriptions?.[0]?.plan_id || 'Free',
            status: u.subscriptions?.[0]?.status || 'inactive'
        })),
        page,
        limit
    };
};

export const banUser = async (userId: string) => {
    // We can interpret 'ban' as deleting the user or setting a flag.
    // For now, let's assume we don't have a 'banned' flag, so maybe just log for now
    // OR we added a 'role' column, maybe we create 'banned' role?
    // Let's create a specific column 'banned' or use metadata. 
    // Supabase Auth has 'banUser' via admin api.

    const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '876000h' // 100 years
    });

    if (error) throw error;
    return { success: true };
};

export const generateInvite = async (planId: string, createdBy: string, trialDays?: number, email?: string, maxUses?: number) => {
    // Generate a unique code
    const code = uuidv4().substring(0, 8).toUpperCase(); // Short code

    const { data, error } = await supabase
        .from('admin_invites')
        .insert([{
            code,
            plan_id: planId,
            created_by: createdBy, // If we add this column, or just ignore
            trial_days: trialDays || null,
            email: email ? email.trim().toLowerCase() : null,
            max_uses: maxUses && maxUses > 1 ? Math.floor(maxUses) : 1,
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const listInvites = async () => {
    const { data, error } = await supabase
        .from('admin_invites')
        .select('id, code, plan_id, trial_days, email, max_uses, uses_count, revoked, created_at, used_at')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) throw new Error(error.message);
    return data;
};

export const revokeInvite = async (id: string) => {
    const { data, error } = await supabase
        .from('admin_invites')
        .update({ revoked: true })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

const SEVERITY_TO_LEVEL: Record<string, string> = {
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    critical: 'CRITICAL',
};

// Lê da tabela real de eventos (system_events, alimentada por eventLogService.logEvent nos
// pontos-chave do backend). Mantém o mesmo formato {id, level, message, timestamp, source}
// que o painel admin já consome, pra não exigir mudança na página de logs.
export const getSystemLogs = async (options: { severity?: string; type?: string; page?: number; limit?: number } = {}) => {
    const { severity, type, page = 1, limit = 50 } = options;

    let query = supabase
        .from('system_events')
        .select('id, type, severity, message, created_at')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (severity) query = query.eq('severity', severity);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return (data || []).map(e => ({
        id: e.id,
        level: SEVERITY_TO_LEVEL[e.severity] || 'INFO',
        message: e.message,
        timestamp: e.created_at,
        source: e.type,
    }));
};

// Faturamento, custo de IA e lucro estimado num período. Datas em ISO (YYYY-MM-DD).
export const getFinanceOverview = async (startDate: string, endDate: string) => {
    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status, metadata, created_at, subscription_id, subscriptions(plan_id)')
        .eq('status', 'PAID')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (paymentsError) throw new Error(paymentsError.message);

    const paidPayments = payments || [];
    const revenueCents = paidPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

    const revenueByPlan: Record<string, number> = {};
    for (const p of paidPayments as any[]) {
        const planId = p.subscriptions?.plan_id;
        const label = PLAN_LABELS[planId] || planId || 'Desconhecido';
        revenueByPlan[label] = (revenueByPlan[label] || 0) + (p.amount || 0);
    }

    const costSummary = await getCostSummary(startDate, endDate);
    const costBRL = costSummary.totalCostUsd * USD_TO_BRL;
    const revenueBRL = revenueCents / 100;
    const profitBRL = revenueBRL - costBRL;

    // Anexa nome/email nos top usuários de custo, pra ficar legível no painel
    const topUserIds = costSummary.topUsers.map(u => u.userId).filter(Boolean);
    let topUsersWithNames: Array<{ userId: string; name: string; email: string; costUsd: number; costBRL: number }> = [];
    if (topUserIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, name, email').in('id', topUserIds);
        topUsersWithNames = costSummary.topUsers.map(u => {
            const user = users?.find((usr: any) => usr.id === u.userId);
            return { userId: u.userId, name: user?.name || 'Desconhecido', email: user?.email || '', costUsd: u.costUsd, costBRL: u.costUsd * USD_TO_BRL };
        });
    }

    return {
        period: { startDate, endDate },
        revenue: {
            totalBRL: revenueBRL,
            paymentCount: paidPayments.length,
            byPlan: Object.fromEntries(Object.entries(revenueByPlan).map(([k, v]) => [k, v / 100])),
        },
        cost: {
            totalUsd: costSummary.totalCostUsd,
            totalBRL: costBRL,
            aiCallCount: costSummary.eventCount,
            byProvider: costSummary.byProvider,
            topUsers: topUsersWithNames,
        },
        profit: {
            totalBRL: profitBRL,
            marginPct: revenueBRL > 0 ? (profitBRL / revenueBRL) * 100 : 0,
        },
        exchangeRateUsed: USD_TO_BRL,
    };
};

// ─── Suporte: visão completa de um cliente ──────────────────────
// Tudo que o cliente está usando, numa chamada só, pra tela de suporte do painel admin
// (/admin/users/[id]): conta, plano, WhatsApps, listas, campanhas com o placar de envio
// (e os erros agrupados), eventos de sistema e conversas com o agente.

// O PostgREST corta em 1000 linhas por request — pagina pra contar mensagens de campanha
// grande (304+ leads) sem perder o final.
async function fetchAllCampaignMessages(campaignIds: string[]) {
    const rows: Array<{ campaign_id: string; status: string; error_message: string | null; updated_at: string }> = [];
    if (campaignIds.length === 0) return rows;
    const pageSize = 1000;
    for (let from = 0; from < 50000; from += pageSize) {
        const { data, error } = await supabase
            .from('campaign_messages')
            .select('campaign_id, status, error_message, updated_at')
            .in('campaign_id', campaignIds)
            .range(from, from + pageSize - 1);
        if (error) throw new Error(error.message);
        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
    }
    return rows;
}

export const getUserDetail = async (userId: string) => {
    const [userRes, subRes, instancesRes, listsRes, campaignsRes, eventsRes, sessionsRes] = await Promise.all([
        supabase
            .from('users')
            .select('id, name, email, role, created_at, last_active_at, onboarding_steps, first_message_sent')
            .eq('id', userId)
            .single(),
        supabase
            .from('subscriptions')
            .select('plan_id, status, trial_ends_at, next_billing_date, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from('instances')
            .select('id, name, status, phone_number, connected_at, status_since, unstable_since, self_reported_chip_days, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }),
        supabase
            .from('contact_lists')
            .select('id, name, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        supabase
            .from('campaigns')
            .select('id, name, status, instance_id, contact_list_id, created_at, scheduled_at, last_message_at, delay_seconds, batch_size, batch_delay_seconds, sequential_mode, media_type, media_url, message, message_variations')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30),
        supabase
            .from('system_events')
            .select('id, type, severity, message, metadata, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100),
        supabase
            .from('agent_sessions')
            .select('id, title, created_at, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(30),
    ]);

    if (userRes.error || !userRes.data) throw new Error('Usuário não encontrado.');

    const instances = instancesRes.data || [];
    const lists = listsRes.data || [];
    const campaigns = campaignsRes.data || [];
    const campaignIds = campaigns.map((c) => c.id);

    const [listCounts, messages, campaignInstancesRes] = await Promise.all([
        Promise.all(lists.map(async (l) => {
            const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('list_id', l.id);
            return count ?? 0;
        })),
        fetchAllCampaignMessages(campaignIds),
        campaignIds.length
            ? supabase.from('campaign_instances').select('campaign_id, instance_id').in('campaign_id', campaignIds)
            : Promise.resolve({ data: [] as Array<{ campaign_id: string; instance_id: string }> }),
    ]);

    const instanceNameById: Record<string, string> = Object.fromEntries(instances.map((i) => [i.id, i.name]));
    const listNameById: Record<string, string> = Object.fromEntries(lists.map((l) => [l.id, l.name]));

    const statsByCampaign: Record<string, { counts: Record<string, number>; errors: Record<string, number>; lastUpdate: string | null }> = {};
    for (const m of messages) {
        const s = (statsByCampaign[m.campaign_id] ??= { counts: {}, errors: {}, lastUpdate: null });
        s.counts[m.status] = (s.counts[m.status] || 0) + 1;
        if (m.error_message) s.errors[m.error_message] = (s.errors[m.error_message] || 0) + 1;
        if (!s.lastUpdate || m.updated_at > s.lastUpdate) s.lastUpdate = m.updated_at;
    }

    const instancesByCampaign: Record<string, string[]> = {};
    for (const ci of campaignInstancesRes.data || []) {
        (instancesByCampaign[ci.campaign_id] ??= []).push(instanceNameById[ci.instance_id] || ci.instance_id);
    }

    return {
        user: userRes.data,
        subscription: subRes.data || null,
        instances,
        lists: lists.map((l, idx) => ({ ...l, contactCount: listCounts[idx] })),
        campaigns: campaigns.map((c) => {
            const stats = statsByCampaign[c.id];
            return {
                ...c,
                listName: c.contact_list_id ? listNameById[c.contact_list_id] ?? null : null,
                instanceNames: instancesByCampaign[c.id] ?? (c.instance_id ? [instanceNameById[c.instance_id] || c.instance_id] : []),
                messageCounts: stats?.counts ?? {},
                errors: Object.entries(stats?.errors ?? {}).map(([message, count]) => ({ message, count })),
                lastMessageUpdate: stats?.lastUpdate ?? null,
            };
        }),
        events: eventsRes.data || [],
        sessions: sessionsRes.data || [],
    };
};

// Conversas com o agente em texto puro (mesmo espírito do log bruto: pra ler e copiar).
// Sem sessionId: todas as sessões dos últimos `days` dias, com os eventos de sistema
// intercalados na ordem real.
export const getUserConversationsText = async (userId: string, opts: { sessionId?: string; days?: number } = {}) => {
    const since = new Date(Date.now() - (opts.days ?? 7) * 24 * 60 * 60 * 1000).toISOString();

    let msgQuery = supabase
        .from('agent_messages')
        .select('session_id, role, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(3000);
    msgQuery = opts.sessionId ? msgQuery.eq('session_id', opts.sessionId) : msgQuery.gte('created_at', since);

    const [msgRes, eventsRes, sessionsRes] = await Promise.all([
        msgQuery,
        opts.sessionId
            ? Promise.resolve({ data: [] as Array<{ type: string; severity: string; message: string; created_at: string }> })
            : supabase.from('system_events').select('type, severity, message, created_at').eq('user_id', userId).gte('created_at', since).order('created_at', { ascending: true }),
        supabase.from('agent_sessions').select('id, title').eq('user_id', userId),
    ]);
    if (msgRes.error) throw new Error(msgRes.error.message);

    const titleById: Record<string, string> = Object.fromEntries((sessionsRes.data || []).map((s) => [s.id, s.title]));
    type Item = { at: string; line?: string; msg?: { session_id: string; role: string; content: string } };
    const items: Item[] = [
        ...(msgRes.data || []).map((m) => ({ at: m.created_at, msg: m })),
        ...(eventsRes.data || []).map((e) => ({ at: e.created_at, line: `⚠️ evento ${e.severity} [${e.type}] ${e.message}` })),
    ].sort((a, b) => a.at.localeCompare(b.at));

    let lastSession: string | null = null;
    const lines: string[] = [];
    for (const item of items) {
        if (!item.msg) {
            lines.push(`[${item.at}] ${item.line}`);
            continue;
        }
        if (item.msg.session_id !== lastSession) {
            lastSession = item.msg.session_id;
            lines.push(`\n=== conversa "${titleById[item.msg.session_id] || 'sem título'}" (${item.msg.session_id}) ===`);
        }
        lines.push(`[${item.at}] ${item.msg.role === 'user' ? 'usuário' : 'agente'}: ${item.msg.content}`);
    }

    return { text: lines.join('\n').trim(), count: (msgRes.data || []).length };
};
