import { supabase } from '../config/supabase';
import { sendDiscordAlert } from './discordService';

export type EventSeverity = 'info' | 'warn' | 'error' | 'critical';

interface LogEventInput {
    type: string;
    severity: EventSeverity;
    message: string;
    userId?: string | null;
    metadata?: Record<string, any>;
}

// Registra um evento do sistema pro painel admin. Nunca lança erro — é um hook de efeito
// colateral chamado de dentro de fluxos quentes (login, envio de mensagem, webhook de
// pagamento), e uma falha aqui não pode derrubar o fluxo principal.
// Sempre que o evento tiver userId, anexa quem é (id/nome/email) no metadata — assim quem
// olha o Discord/painel admin sabe imediatamente de qual conta veio o evento, sem precisar
// que cada chamador de logEvent lembre de passar isso manualmente.
async function enrichMetadataWithUser(userId: string | null | undefined, metadata?: Record<string, any>) {
    if (!userId) return metadata;

    try {
        const { data: user } = await supabase.from('users').select('name, email').eq('id', userId).single();
        return {
            ...metadata,
            usuarioId: userId,
            usuarioNome: user?.name || 'desconhecido',
            usuarioEmail: user?.email || 'desconhecido',
        };
    } catch {
        return { ...metadata, usuarioId: userId };
    }
}

export async function logEvent({ type, severity, message, userId, metadata }: LogEventInput): Promise<void> {
    try {
        const enrichedMetadata = await enrichMetadataWithUser(userId, metadata);

        const { error } = await supabase.from('system_events').insert([{
            type,
            severity,
            message,
            user_id: userId || null,
            metadata: enrichedMetadata || null,
        }]);

        if (error) {
            console.error('[EventLogService] Failed to insert event:', error.message);
            return;
        }

        // Fire-and-forget — nunca bloqueia quem chamou logEvent.
        if (severity === 'warn' || severity === 'error' || severity === 'critical') {
            sendDiscordAlert({ type, severity, message, metadata: enrichedMetadata }).catch(err =>
                console.error('[EventLogService] Failed to send Discord alert:', err)
            );
        }
    } catch (error: any) {
        console.error('[EventLogService] Unexpected error:', error.message);
    }
}
