import { supabase } from '../config/supabase';

const SENSITIVE_KEY_PATTERN = /password|token|secret|apikey|api_key|authorization|cvv|card_number|cardnumber|pix_key|base64/i;
const MAX_FIELD_LEN = 2000;
const MAX_SERIALIZED_LEN = 8000;

function redact(value: any, depth = 0): any {
    if (depth > 4) return '[...]';
    if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
    if (value && typeof value === 'object') {
        const out: Record<string, any> = {};
        for (const [key, v] of Object.entries(value)) {
            if (SENSITIVE_KEY_PATTERN.test(key)) {
                out[key] = '[REDACTED]';
            } else if (typeof v === 'string' && v.length > MAX_FIELD_LEN) {
                out[key] = `${v.slice(0, MAX_FIELD_LEN)}...[+${v.length - MAX_FIELD_LEN} chars]`;
            } else {
                out[key] = redact(v, depth + 1);
            }
        }
        return out;
    }
    return value;
}

function safeStringify(value: any): string | null {
    if (value === undefined || value === null) return null;
    try {
        const str = JSON.stringify(redact(value));
        if (!str || str === '{}') return null;
        return str.length > MAX_SERIALIZED_LEN ? `${str.slice(0, MAX_SERIALIZED_LEN)}...[truncado]` : str;
    } catch {
        return null;
    }
}

interface RawActivityInput {
    userId?: string | null;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    requestBody?: any;
    responseBody?: any;
}

// Fire-and-forget, igual eventLogService — nunca pode atrasar/derrubar a request real.
export function logRawActivity(input: RawActivityInput): void {
    supabase
        .from('raw_activity_logs')
        .insert([{
            user_id: input.userId || null,
            method: input.method,
            path: input.path,
            status_code: input.statusCode,
            duration_ms: input.durationMs,
            request_body: safeStringify(input.requestBody),
            response_body: safeStringify(input.responseBody),
        }])
        .then(({ error }) => {
            if (error) console.error('[ActivityLogService] Failed to insert:', error.message);
        });
}

// Formata como texto puro (nao JSON) — pensado pra ser copiado e analisado depois, nao pra
// ser exibido bonito numa UI. Cada bloco tem tudo que a request carregou, ja com dados
// sensiveis redigidos pelo safeStringify acima.
export async function getRawActivityLogsText(from: string, to: string, limit = 5000): Promise<{ text: string; count: number; truncated: boolean }> {
    const { data, error } = await supabase
        .from('raw_activity_logs')
        .select('created_at, user_id, method, path, status_code, duration_ms, request_body, response_body')
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: true })
        .limit(limit + 1);

    if (error) throw new Error(error.message);

    const rows = data || [];
    const truncated = rows.length > limit;
    const visibleRows = truncated ? rows.slice(0, limit) : rows;

    const userIds = [...new Set(visibleRows.map((r) => r.user_id).filter(Boolean))];
    const usersById: Record<string, { name: string; email: string }> = {};
    if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, name, email').in('id', userIds);
        for (const u of users || []) {
            usersById[u.id] = { name: u.name, email: u.email };
        }
    }

    const lines = visibleRows.map((row) => {
        const user = row.user_id ? usersById[row.user_id] : null;
        const userLabel = user ? `${user.name} <${user.email}>` : row.user_id ? row.user_id : 'anonimo';
        const header = `[${row.created_at}] user=${userLabel} ${row.method} ${row.path} status=${row.status_code} dur=${row.duration_ms}ms`;
        const bodyLine = row.request_body ? `  body: ${row.request_body}` : null;
        const respLine = row.response_body ? `  resp: ${row.response_body}` : null;
        return [header, bodyLine, respLine].filter(Boolean).join('\n');
    });

    return {
        text: lines.join('\n---\n'),
        count: visibleRows.length,
        truncated,
    };
}
