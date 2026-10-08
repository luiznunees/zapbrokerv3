// Janela de envio do disparo — em que horário, em que dias e quantas mensagens por dia um
// disparo pode mandar. Achado real (Fernanda, 04/10): disparo de 304 contatos frios começou
// às 05h23 de um domingo, 1 mensagem a cada 3min, e o número foi banido em ~7h. O que
// funcionou na prática do lado dela: 50 mensagens das 8h ao meio-dia, mais 50 do meio-dia
// às 17h — por isso o padrão aqui é 8h–17h, até 100 por dia, segunda a sábado.
//
// Horários sempre no fuso de Brasília. O Brasil não tem horário de verão desde 2019, então
// o deslocamento fixo de -03:00 é seguro pra montar timestamps.

export interface SendWindow {
    startMinute: number;       // minutos desde 00h (480 = 08:00)
    endMinute: number;         // minutos desde 00h, exclusivo (1020 = 17:00)
    weekdays: number[];        // 0 = domingo ... 6 = sábado
    maxPerDay: number | null;  // null = sem teto diário (só respeita o horário)
}

export const DEFAULT_SEND_WINDOW: SendWindow = {
    startMinute: 8 * 60,
    endMinute: 17 * 60,
    weekdays: [1, 2, 3, 4, 5, 6],
    maxPerDay: 100,
};

// Nenhum intervalo calculado fica abaixo disso, mesmo pedindo 200 mensagens em 1 hora.
export const MIN_WINDOW_DELAY_SECONDS = 60;

// Tempo médio que cada mensagem já gasta além do intervalo (digitação simulada de 2–15s +
// chamadas à Evolution) — sai da conta pra janela fechar no horário.
const AVG_SEND_OVERHEAD_SECONDS = 10;

// Só 90% da janela é usada na conta: o intervalo é sorteado entre 70% e 130% do valor base,
// e a folga evita que a última mensagem do dia escorregue pra fora do horário.
const WINDOW_USAGE = 0.9;

const SAO_PAULO_OFFSET = '-03:00';
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function saoPauloParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23',
    }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
    return {
        ymd: `${get('year')}-${get('month')}-${get('day')}`,
        minute: Number(get('hour')) * 60 + Number(get('minute')),
        weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
    };
}

export function isInsideWindow(window: SendWindow, now: Date = new Date()): boolean {
    const { minute, weekday } = saoPauloParts(now);
    return window.weekdays.includes(weekday) && minute >= window.startMinute && minute < window.endMinute;
}

// Início da janela de hoje (horário de Brasília) — base pra contar quantas já saíram hoje.
export function todayWindowStartIso(window: SendWindow, now: Date = new Date()): string {
    const { ymd } = saoPauloParts(now);
    const hh = String(Math.floor(window.startMinute / 60)).padStart(2, '0');
    const mm = String(window.startMinute % 60).padStart(2, '0');
    return new Date(`${ymd}T${hh}:${mm}:00${SAO_PAULO_OFFSET}`).toISOString();
}

// Intervalo base entre mensagens pra caber `maxPerDay` dentro da janela.
export function computeWindowDelaySeconds(window: SendWindow): number | null {
    if (!window.maxPerDay) return null;
    const windowSeconds = (window.endMinute - window.startMinute) * 60;
    const perMessage = (windowSeconds * WINDOW_USAGE) / window.maxPerDay - AVG_SEND_OVERHEAD_SECONDS;
    return Math.max(MIN_WINDOW_DELAY_SECONDS, Math.floor(perMessage));
}

// Valida e normaliza o que vem do front/agente (campo faltando = padrão). Lança erro em
// português quando não dá pra usar.
export function normalizeSendWindow(input: Partial<SendWindow> | null | undefined): SendWindow {
    const w: SendWindow = {
        startMinute: input?.startMinute ?? DEFAULT_SEND_WINDOW.startMinute,
        endMinute: input?.endMinute ?? DEFAULT_SEND_WINDOW.endMinute,
        weekdays: input?.weekdays ?? DEFAULT_SEND_WINDOW.weekdays,
        maxPerDay: input?.maxPerDay === undefined ? DEFAULT_SEND_WINDOW.maxPerDay : input.maxPerDay,
    };
    w.startMinute = Math.round(Number(w.startMinute));
    w.endMinute = Math.round(Number(w.endMinute));
    w.weekdays = [...new Set((w.weekdays || []).map(Number).filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    w.maxPerDay = w.maxPerDay === null ? null : Math.round(Number(w.maxPerDay));

    if (!(w.startMinute >= 0 && w.endMinute <= 24 * 60 && w.startMinute < w.endMinute)) {
        throw new Error('Horário de envio inválido: o fim precisa ser depois do início.');
    }
    if (w.endMinute - w.startMinute < 60) {
        throw new Error('A janela de envio precisa ter pelo menos 1 hora.');
    }
    if (w.weekdays.length === 0) {
        throw new Error('Escolha pelo menos um dia da semana pra enviar.');
    }
    if (w.maxPerDay !== null && !(w.maxPerDay >= 1)) {
        throw new Error('A quantidade de mensagens por dia precisa ser pelo menos 1.');
    }
    return w;
}

// Formato das colunas em campaigns — ver migrations/campaign_send_window.sql.
export function sendWindowFromCampaignRow(row: any): SendWindow {
    return {
        startMinute: row?.window_start_minute ?? 0,
        endMinute: row?.window_end_minute ?? 24 * 60,
        weekdays: Array.isArray(row?.window_weekdays) ? row.window_weekdays : [0, 1, 2, 3, 4, 5, 6],
        maxPerDay: row?.window_max_per_day ?? null,
    };
}

export function sendWindowToCampaignColumns(w: SendWindow) {
    return {
        window_start_minute: w.startMinute,
        window_end_minute: w.endMinute,
        window_weekdays: w.weekdays,
        window_max_per_day: w.maxPerDay,
    };
}

export function formatMinute(minute: number): string {
    const h = Math.floor(minute / 60);
    const m = minute % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function describeSendWindow(w: SendWindow): string {
    const days = w.weekdays.join(',') === '1,2,3,4,5,6' ? 'seg a sáb'
        : w.weekdays.join(',') === '1,2,3,4,5' ? 'seg a sex'
        : w.weekdays.length === 7 ? 'todo dia'
        : w.weekdays.map(d => WEEKDAY_SHORT[d]).join(', ');
    const cap = w.maxPerDay ? `, até ${w.maxPerDay} por dia` : '';
    return `das ${formatMinute(w.startMinute)} às ${formatMinute(w.endMinute)}, ${days}${cap}`;
}
