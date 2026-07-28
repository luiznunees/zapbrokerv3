import { supabase } from '../config/supabase';
import * as emailService from './emailService';
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
export async function logEvent({ type, severity, message, userId, metadata }: LogEventInput): Promise<void> {
    try {
        const { error } = await supabase.from('system_events').insert([{
            type,
            severity,
            message,
            user_id: userId || null,
            metadata: metadata || null,
        }]);

        if (error) {
            console.error('[EventLogService] Failed to insert event:', error.message);
            return;
        }

        // Fire-and-forget — nunca bloqueia quem chamou logEvent.
        if (severity === 'critical') {
            emailService.sendAdminAlertEmail(type, message).catch(err =>
                console.error('[EventLogService] Failed to send admin alert email:', err)
            );
        }
        if (severity === 'warn' || severity === 'error' || severity === 'critical') {
            sendDiscordAlert({ type, severity, message, metadata }).catch(err =>
                console.error('[EventLogService] Failed to send Discord alert:', err)
            );
        }
    } catch (error: any) {
        console.error('[EventLogService] Unexpected error:', error.message);
    }
}
