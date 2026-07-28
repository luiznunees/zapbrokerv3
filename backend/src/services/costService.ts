import { supabase } from '../config/supabase';
import { estimateCostUsd } from '../config/aiPricing';

interface LogAiCostParams {
    userId: string;
    sessionId?: string | null;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
}

// Fire-and-forget: nunca deve atrapalhar a resposta do agente por causa de log de custo.
export function logAiCost(params: LogAiCostParams): void {
    const costUsd = estimateCostUsd(params.model, params.inputTokens, params.outputTokens);

    supabase
        .from('ai_cost_events')
        .insert({
            user_id: params.userId,
            session_id: params.sessionId || null,
            provider: params.provider,
            model: params.model,
            input_tokens: params.inputTokens,
            output_tokens: params.outputTokens,
            cost_usd: costUsd,
        })
        .then(({ error }: any) => {
            if (error) console.error('[CostService] Failed to log AI cost:', error.message);
        });
}

export async function getCostSummary(startDate: string, endDate: string) {
    const { data, error } = await supabase
        .from('ai_cost_events')
        .select('user_id, provider, model, input_tokens, output_tokens, cost_usd, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (error) throw new Error(error.message);

    const events = data || [];
    const totalCostUsd = events.reduce((acc: number, e: any) => acc + Number(e.cost_usd || 0), 0);

    const byUser = new Map<string, number>();
    for (const e of events) {
        byUser.set(e.user_id, (byUser.get(e.user_id) || 0) + Number(e.cost_usd || 0));
    }
    const topUsers = Array.from(byUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, costUsd]) => ({ userId, costUsd }));

    const byProvider = new Map<string, number>();
    for (const e of events) {
        byProvider.set(e.provider, (byProvider.get(e.provider) || 0) + Number(e.cost_usd || 0));
    }

    return {
        totalCostUsd,
        eventCount: events.length,
        topUsers,
        byProvider: Object.fromEntries(byProvider),
    };
}
