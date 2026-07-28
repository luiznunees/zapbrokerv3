import type { EventSeverity } from './eventLogService';

const SEVERITY_COLOR: Record<EventSeverity, number> = {
    info: 0x0ea5e9,     // azul
    warn: 0xf59e0b,     // âmbar
    error: 0xef4444,    // vermelho
    critical: 0xdc2626, // vermelho forte
};

const SEVERITY_LABEL: Record<EventSeverity, string> = {
    info: 'ℹ️ Info',
    warn: '⚠️ Aviso',
    error: '🔴 Erro',
    critical: '🚨 Crítico',
};

interface DiscordAlertInput {
    type: string;
    severity: EventSeverity;
    message: string;
    metadata?: Record<string, any>;
}

// Manda um evento pro canal do Discord via webhook (ver instruções de setup no README/chat).
// Sem DISCORD_WEBHOOK_URL configurada, só loga aviso uma vez e segue — nunca quebra quem chamou.
let warnedMissingWebhook = false;

export async function sendDiscordAlert({ type, severity, message, metadata }: DiscordAlertInput): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        if (!warnedMissingWebhook) {
            console.warn('DISCORD_WEBHOOK_URL not configured — Discord alerts disabled');
            warnedMissingWebhook = true;
        }
        return;
    }

    try {
        const fields = metadata && Object.keys(metadata).length > 0
            ? Object.entries(metadata).slice(0, 10).map(([name, value]) => ({
                name,
                value: String(value ?? '—'),
                inline: true,
            }))
            : undefined;

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'ZapBroker',
                embeds: [{
                    title: `${SEVERITY_LABEL[severity]} — ${type}`,
                    description: message,
                    color: SEVERITY_COLOR[severity],
                    fields,
                    timestamp: new Date().toISOString(),
                }],
            }),
        });
    } catch (error: any) {
        console.error('[DiscordService] Failed to send alert:', error.message);
    }
}
