import { supabase } from '../config/supabase';

interface ToolCallTrace {
    name: string;
    args: any;
    ok: boolean;
}

interface LogAgentTurnParams {
    userId: string;
    sessionId: string;
    userMessage: string;
    toolCalls: ToolCallTrace[];
    iterations: number;
    hitIterationLimit: boolean;
    finalReply: string;
    provider: string;
    model: string;
}

// Fire-and-forget, mesmo padrão de costService.logAiCost — logar a execução nunca deve
// atrapalhar ou atrasar a resposta do agente pro usuário.
export function logAgentTurn(params: LogAgentTurnParams): void {
    supabase
        .from('agent_turn_logs')
        .insert({
            user_id: params.userId,
            session_id: params.sessionId,
            user_message: params.userMessage.slice(0, 300),
            tool_calls: params.toolCalls,
            iterations: params.iterations,
            hit_iteration_limit: params.hitIterationLimit,
            final_reply: params.finalReply.slice(0, 500),
            provider: params.provider,
            model: params.model,
        })
        .then(({ error }: any) => {
            if (error) console.error('[AgentLogService] Failed to log agent turn:', error.message);
        });
}

// Usado pela suite de regressão (backend/scripts/agent-regression.ts) pra verificar o que
// realmente aconteceu num turno específico, em vez de adivinhar pelo texto da resposta.
export async function getRecentAgentTurns(userId: string, sessionId: string, limit: number = 1) {
    const { data, error } = await supabase
        .from('agent_turn_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[AgentLogService] Failed to fetch agent turns:', error.message);
        return [];
    }
    return data || [];
}
