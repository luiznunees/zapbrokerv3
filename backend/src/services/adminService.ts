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
        data: data.map(u => ({
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

export const generateInvite = async (planId: string, createdBy: string) => {
    // Generate a unique code
    const code = uuidv4().substring(0, 8).toUpperCase(); // Short code

    const { data, error } = await supabase
        .from('admin_invites')
        .insert([{
            code,
            plan_id: planId,
            created_by: createdBy // If we add this column, or just ignore
        }])
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
