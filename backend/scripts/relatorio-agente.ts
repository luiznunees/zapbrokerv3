// Extrai as conversas BRUTAS do agente de IA — o que a pessoa escreveu, o que o agente
// respondeu, sem corte e sem nenhuma heurística/filtro em cima. A análise de como o agente
// está indo (o que vale corrigir, se generaliza pra outros usuários) é feita depois, fora
// daqui, na leitura do bruto — não é esse script que decide o que é "problema".
//
// Também inclui, por usuário, os eventos de sistema (system_events — desconexão de
// WhatsApp, falha de envio, login falhado etc.) intercalados na mesma linha do tempo das
// conversas, na ordem real em que aconteceram — pra dar pra ver de cara se um erro
// aconteceu durante um trecho específico do papo, sem precisar cruzar duas listas na mão.
//
// Também inclui o feedback explícito de beta (beta_feedback) — é dado bruto da própria
// pessoa (nota, o que confundiu, se teve erro), não um cálculo.
//
// Roda com: npm run relatorio:agente
//   - pergunta o período: Enter = hoje, uma data (AAAA-MM-DD), ou "todos" pra puxar TODAS
//     as conversas já registradas, de todos os dias
//   - ou pula a pergunta: npm run relatorio:agente -- --data=2026-09-18
//                          npm run relatorio:agente -- --data=todos
require('dotenv').config();

const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { supabase } = require('../src/config/supabase');

const TZ = 'America/Sao_Paulo';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

interface Period {
  label: string; // usado no nome do arquivo e no título do relatório
  start: string | null; // ISO, null = sem filtro (todos os dias)
  end: string | null;
}

// --data=AAAA-MM-DD ou --data=todos pula a pergunta (útil se um dia isso virar automação);
// sem a flag, pergunta no terminal — mais fácil de usar do dia a dia do que lembrar sintaxe.
async function resolvePeriod(): Promise<Period> {
  const arg = process.argv.find((a) => a.startsWith('--data='));
  const raw = arg ? arg.split('=')[1] : await ask();

  if (raw.toLowerCase() === 'todos' || raw.toLowerCase() === 'all') {
    return { label: 'todos', start: null, end: null };
  }

  const start = moment.tz(raw, TZ).startOf('day');
  const end = moment.tz(raw, TZ).endOf('day');
  return { label: raw, start: start.toISOString(), end: end.toISOString() };

  async function ask(): Promise<string> {
    const hoje = moment().tz(TZ).format('YYYY-MM-DD');
    while (true) {
      const resposta = await askQuestion(
        `Gerar conversas de qual período? (Enter = hoje ${hoje}, uma data AAAA-MM-DD, ou "todos" pra tudo): `
      );
      if (!resposta) return hoje;
      if (resposta.toLowerCase() === 'todos' || resposta.toLowerCase() === 'all') return resposta;
      if (/^\d{4}-\d{2}-\d{2}$/.test(resposta) && moment(resposta, 'YYYY-MM-DD', true).isValid()) return resposta;
      console.log('Entrada inválida — use AAAA-MM-DD (ex: 2026-09-18) ou "todos".');
    }
  }
}

async function main() {
  const period = await resolvePeriod();
  console.log(`Puxando conversas brutas do agente (${period.label === 'todos' ? 'todos os dias' : period.label})...`);

  let messagesQuery = supabase
    .from('agent_messages')
    .select('session_id, user_id, role, content, created_at')
    .order('created_at', { ascending: true });
  if (period.start) messagesQuery = messagesQuery.gte('created_at', period.start).lte('created_at', period.end);

  const { data: messages, error: messagesError } = await messagesQuery;
  if (messagesError) {
    console.error('Erro ao buscar agent_messages:', messagesError.message);
    process.exit(1);
  }

  let feedbackQuery = supabase.from('beta_feedback').select('*').order('created_at', { ascending: true });
  if (period.start) feedbackQuery = feedbackQuery.gte('created_at', period.start).lte('created_at', period.end);

  const { data: feedback, error: feedbackError } = await feedbackQuery;
  if (feedbackError) console.warn('Erro ao buscar beta_feedback:', feedbackError.message);

  let eventsQuery = supabase
    .from('system_events')
    .select('id, type, severity, message, user_id, metadata, created_at')
    .order('created_at', { ascending: true });
  if (period.start) eventsQuery = eventsQuery.gte('created_at', period.start).lte('created_at', period.end);

  const { data: events, error: eventsError } = await eventsQuery;
  if (eventsError) console.warn('Erro ao buscar system_events:', eventsError.message);

  if ((!messages || messages.length === 0) && (!feedback || feedback.length === 0) && (!events || events.length === 0)) {
    console.log(`Nenhuma conversa, feedback ou evento registrado em ${period.label}. Nada a gerar.`);
    process.exit(0);
  }

  const sessionIds = [...new Set((messages || []).map((m: any) => m.session_id).filter(Boolean))] as string[];
  const userIds = [
    ...new Set([
      ...(messages || []).map((m: any) => m.user_id).filter(Boolean),
      ...(feedback || []).map((f: any) => f.user_id).filter(Boolean),
      ...(events || []).map((e: any) => e.user_id).filter(Boolean),
    ]),
  ] as string[];

  const { data: users } = userIds.length
    ? await supabase.from('users').select('id, name, email').in('id', userIds)
    : { data: [] as any[] };
  const userMap = new Map<string, any>((users || []).map((u: any) => [u.id, u]));

  const { data: sessions } = sessionIds.length
    ? await supabase.from('agent_sessions').select('id, title, user_id, created_at').in('id', sessionIds)
    : { data: [] as any[] };
  const sessionMap = new Map<string, any>((sessions || []).map((s: any) => [s.id, s]));

  const messagesBySession = new Map<string, any[]>();
  for (const m of messages || []) {
    if (!messagesBySession.has(m.session_id)) messagesBySession.set(m.session_id, []);
    messagesBySession.get(m.session_id)!.push(m);
  }

  function labelUser(userId: string): string {
    if (userId === 'sistema') return 'Eventos sem usuário identificado';
    const u = userMap.get(userId);
    if (!u) return userId.slice(0, 8);
    return `${u.name} (${u.email})`;
  }

  // Sessões agrupadas por usuário (pra reler "tudo que a Fernanda falou" de uma vez),
  // em ordem cronológica dentro de cada usuário.
  const sessionsByUser = new Map<string, string[]>();
  for (const sessionId of sessionIds) {
    const session = sessionMap.get(sessionId);
    const ownerId = session?.user_id || (messagesBySession.get(sessionId) || [])[0]?.user_id || 'desconhecido';
    if (!sessionsByUser.has(ownerId)) sessionsByUser.set(ownerId, []);
    sessionsByUser.get(ownerId)!.push(sessionId);
  }
  for (const [, ids] of sessionsByUser) {
    ids.sort((a, b) => {
      const ta = sessionMap.get(a)?.created_at || '';
      const tb = sessionMap.get(b)?.created_at || '';
      return ta.localeCompare(tb);
    });
  }

  // Eventos de sistema agrupados por usuário (evento sem user_id, ex: tentativa de login
  // com email inválido, cai no balde "sistema") — usados pra intercalar na timeline abaixo.
  const eventsByUser = new Map<string, any[]>();
  for (const e of events || []) {
    const ownerId = e.user_id || 'sistema';
    if (!eventsByUser.has(ownerId)) eventsByUser.set(ownerId, []);
    eventsByUser.get(ownerId)!.push(e);
  }

  // União de quem tem sessão e/ou evento — cobre usuário que só teve erro (ex: login
  // falhado) sem nunca ter conversado com o agente.
  const timelineUserIds = [...new Set([...sessionsByUser.keys(), ...eventsByUser.keys()])];

  const eventsBySeverity = new Map<string, number>();
  for (const e of events || []) {
    eventsBySeverity.set(e.severity, (eventsBySeverity.get(e.severity) || 0) + 1);
  }

  const titulo = period.label === 'todos' ? 'todos os dias' : period.label;
  let md = `# Conversas do agente — ${titulo}\n\n`;
  md += `Gerado em ${moment().tz(TZ).format('DD/MM/YYYY HH:mm')} (${TZ}).\n\n`;
  md += `## Resumo\n\n`;
  md += `- Mensagens: ${messages?.length || 0}\n`;
  md += `- Sessões: ${sessionIds.length}\n`;
  md += `- Usuários: ${userIds.length ? userIds.map((id) => labelUser(id)).join(', ') : 'nenhum'}\n`;
  md += `- Eventos de sistema: ${events?.length || 0}${
    eventsBySeverity.size ? ` (${[...eventsBySeverity.entries()].map(([sev, n]) => `${sev}: ${n}`).join(', ')})` : ''
  }\n`;
  md += `- Feedback explícito (beta_feedback): ${feedback?.length || 0}\n\n`;

  md += `## Conversas brutas\n\n`;
  md += `Mensagens e eventos de sistema intercalados na ordem real em que aconteceram, por usuário.\n\n`;
  if (timelineUserIds.length === 0) {
    md += `Nenhuma conversa nem evento registrado em ${period.label}.\n\n`;
  } else {
    for (const userId of timelineUserIds) {
      md += `## ${labelUser(userId)}\n\n`;

      type TimelineItem =
        | { ts: string; kind: 'msg'; sessionId: string; role: string; content: string }
        | { ts: string; kind: 'event'; type: string; severity: string; message: string };

      const timeline: TimelineItem[] = [];
      for (const sessionId of sessionsByUser.get(userId) || []) {
        for (const m of messagesBySession.get(sessionId) || []) {
          timeline.push({ ts: m.created_at, kind: 'msg', sessionId, role: m.role, content: m.content });
        }
      }
      for (const e of eventsByUser.get(userId) || []) {
        timeline.push({ ts: e.created_at, kind: 'event', type: e.type, severity: e.severity, message: e.message });
      }
      timeline.sort((a, b) => a.ts.localeCompare(b.ts));

      let lastSessionId: string | null = null;
      for (const item of timeline) {
        if (item.kind === 'event') {
          const icone = item.severity === 'error' ? '🔴' : item.severity === 'warn' ? '⚠️' : 'ℹ️';
          md += `**${icone} evento** (${moment(item.ts).tz(TZ).format('DD/MM HH:mm')}): [${item.type}] ${item.message}\n\n`;
          continue;
        }

        if (item.sessionId !== lastSessionId) {
          const session = sessionMap.get(item.sessionId);
          const msgCount = (messagesBySession.get(item.sessionId) || []).length;
          md += `### ${session?.title || 'sessão sem título'} — ${moment(session?.created_at).tz(TZ).format('DD/MM/YYYY HH:mm')} (${msgCount} mensagens)\n\n`;
          lastSessionId = item.sessionId;
        }

        const who = item.role === 'assistant' || item.role === 'agent' ? '🤖 agente' : item.role === 'system' ? '⚙️ sistema' : '👤 usuário';
        md += `**${who}** (${moment(item.ts).tz(TZ).format('DD/MM HH:mm')}): ${item.content}\n\n`;
      }
    }
  }

  md += `## Feedback explícito\n\n`;
  if (!feedback || feedback.length === 0) {
    md += `Nenhum feedback (beta_feedback) registrado em ${period.label}.\n\n`;
  } else {
    for (const f of feedback) {
      md += `### ${f.name || 'sem nome'} (${f.email || 'sem email'}) — ${moment(f.created_at).tz(TZ).format('DD/MM/YYYY HH:mm')}\n\n`;
      md += `- Nota geral: ${f.overall_rating ?? '—'} | Facilidade: ${f.ease_rating ?? '—'}\n`;
      md += `- Curtiu: ${f.liked || '—'}\n`;
      md += `- Confuso: ${f.confusing || '—'}\n`;
      md += `- Teve erro: ${f.had_error ? `sim — ${f.error_description || 'sem descrição'}` : 'não'}\n`;
      md += `- Sugestões: ${f.improvements || '—'}\n`;
      md += `- Página: ${f.page_url || '—'}\n\n`;
    }
  }

  const outDir = path.join(__dirname, '..', 'relatorios');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `conversas-agente-${period.label}.md`);
  fs.writeFileSync(outPath, md, 'utf-8');

  console.log(`\n✅ Arquivo salvo em: ${outPath}`);
  console.log(`   ${messages?.length || 0} mensagens, ${sessionIds.length} sessões, ${feedback?.length || 0} feedback(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('ERRO:', err);
  process.exit(1);
});
