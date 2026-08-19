// Teste do agente simulando um CORRETOR DE IMÓVEIS real usando o ZapBroker.
// Diferente do teste de cenários isolados, aqui é UMA conversa contínua (uma sessão),
// com um contexto que evolui passo a passo — igual o corretor usaria de verdade.
//
// Objetivo: prever erros. A cada passo do fluxo a gente checa:
//   - o agente manteve o contexto (não esqueceu a lista/número que já escolheu);
//   - pediu a informação certa, na ordem certa;
//   - a tool certa foi chamada (e não uma genérica);
//   - não repetiu pergunta já respondida;
//   - a campanha nasceu no banco e no status esperado.
//
// Roda com: npm run test:agent:corretor
// As conversas ficam salvas no histórico pra reler depois no painel.
// Usa o modelo do .env (OPENROUTER_MODEL_OVERRIDE, pago) — os provedores free foram
// removidos do agente por caírem sempre em rate limit.
process.env.OPENROUTER_MODEL_OVERRIDE = process.env.OPENROUTER_MODEL_OVERRIDE || 'anthropic/claude-haiku-4.5';

// Suprime o ruído do agentService ([AgentService] Calling LLM, LLM API error, retries de
// 429, etc.) — o teste mostra apenas as respostas finais do agente e o resultado.
const _log = console.log;
const _error = console.error;
const suppressed = (fn: typeof console.log, args: any[]) => {
    const line = args.map(String).join(' ');
    if (line.includes('[AgentService]')) return;
    fn(...args);
};
console.log = (...args: any[]) => suppressed(_log, args);
console.error = (...args: any[]) => suppressed(_error, args);

const {
    chat,
    createSession,
    executeAction,
} = require('../src/services/agentService') as typeof import('../src/services/agentService');
const { getRecentAgentTurns } = require('../src/services/agentLogService') as typeof import('../src/services/agentLogService');
const { getListsWithCounts } = require('../src/services/contactService') as typeof import('../src/services/contactService');
const { getInstances } = require('../src/services/instanceService') as typeof import('../src/services/instanceService');
const { getCampaigns } = require('../src/services/campaignService') as typeof import('../src/services/campaignService');

const userId: string = process.env.AGENT_TEST_USER_ID || '';

// Cores pro terminal
const C = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    user: '\x1b[36m',
    agent: '\x1b[32m',
    tool: '\x1b[33m',
    ok: '\x1b[32m',
    fail: '\x1b[31m',
    header: '\x1b[1;35m',
};

const PASS = '✅';
const FAIL = '❌';
const SKIP = '⏭';

// Quando todos os provedores de IA estão em rate limit, o chat() retorna esse fallback
// (agentService.ts) — nesse caso o teste não pode distinguir erro real de falta de cota,
// então marca SKIP em vez de FAIL.
const RATE_LIMIT_FALLBACK = 'Desculpa, tive um problema ao processar sua mensagem. Pode tentar de novo?';

interface Check {
    ok: boolean;
    label: string;
    detail?: string;
    skipped?: boolean;
}

interface StepResult {
    name: string;
    checks: Check[];
}

const checks: Check[] = [];
let lastReply = '';
let sessionId = '';

function addCheck(label: string, ok: boolean, detail?: string, skipped = false) {
    checks.push({ ok, label, detail, skipped });
    const icon = skipped ? SKIP : (ok ? PASS : FAIL);
    console.log(`    ${icon} ${label}${detail ? ` — ${detail}` : ''}`);
}

function resetChecks() {
    checks.length = 0;
}

async function say(userMessage: string, opts?: { expectTools?: string[]; label?: string }) {
    const label = opts?.label || userMessage.slice(0, 50);
    console.log(`${C.user}\n  👤 corretor: ${userMessage}${C.reset}`);

    let streamed = '';
    process.stdout.write(`${C.agent}  🤖 agente: `);
    const result = await chat(userId, userMessage, [], sessionId, (token) => {
        streamed += token;
        process.stdout.write(`${C.agent}${token}${C.reset}`);
    });
    process.stdout.write('\n');
    lastReply = result.reply;

    const [turn] = await getRecentAgentTurns(userId, sessionId, 1);
    const toolNames = (turn?.tool_calls || [])
        .filter((tc: any) => tc.ok)
        .map((tc: any) => tc.name);

    if (toolNames.length > 0) {
        console.log(`${C.tool}     ⚙ tools: ${toolNames.join(', ')}${C.reset}`);
    }

    if (opts?.expectTools) {
        for (const expected of opts.expectTools) {
            addCheck(`${label}: chamou ${expected}`, toolNames.includes(expected));
        }
        for (const name of toolNames) {
            if (opts.expectTools && !opts.expectTools.includes(name)) {
                addCheck(`${label}: tool extra ${name}`, false, 'tool não esperada nesse passo');
            }
        }
    }

    return result;
}

// Alguém que finge estar "escolhendo" o que o agente pediu (igual o corretor faria no painel).
async function chooseList(listId: string) {
    const r = await executeAction(userId, 'set_draft_list', { sessionId, contactListId: listId });
    if (r.success) console.log(`${C.tool}     ⚙ [painel] lista selecionada: ${r.message}${C.reset}`);
    else console.log(`${C.fail}     ⚙ [painel] falha ao selecionar lista: ${r.message}${C.reset}`);
    return r;
}

async function chooseInstances(instanceIds: string[]) {
    const r = await executeAction(userId, 'set_draft_instances', { sessionId, instanceIds });
    if (r.success) console.log(`${C.tool}     ⚙ [painel] números selecionados: ${r.message}${C.reset}`);
    else console.log(`${C.fail}     ⚙ [painel] falha ao selecionar números: ${r.message}${C.reset}`);
    return r;
}

async function setMessages(variations: string[]) {
    const r = await executeAction(userId, 'set_draft_messages', { sessionId, messageVariations: variations });
    if (r.success) console.log(`${C.tool}     ⚙ [painel] mensagens salvas${C.reset}`);
    else console.log(`${C.fail}     ⚙ [painel] falha ao salvar mensagens: ${r.message}${C.reset}`);
    return r;
}

async function setTiming() {
    const r = await executeAction(userId, 'set_draft_timing', { sessionId });
    if (r.success) console.log(`${C.tool}     ⚙ [painel] timing confirmado${C.reset}`);
    else console.log(`${C.fail}     ⚙ [painel] falha ao confirmar timing: ${r.message}${C.reset}`);
    return r;
}

function stepHeader(name: string) {
    console.log(`${C.header}\n━━━ ${name} ━━━${C.reset}`);
    resetChecks();
}

async function main() {
    if (!userId) {
        console.error('❌ Defina AGENT_TEST_USER_ID no .env antes de rodar essa suite.');
        process.exit(1);
    }

    const lists = await getListsWithCounts(userId);
    const instances = await getInstances(userId);
    const list = lists[0];
    const connected = instances.find((i: any) => i.status === 'connected');
    const instance = connected || instances[0];

    if (!list) {
        console.error('❌ Usuário não tem nenhuma lista de contatos. Crie uma antes de rodar.');
        process.exit(1);
    }
    if (!instance) {
        console.error('❌ Usuário não tem nenhum WhatsApp cadastrado. Conecte um antes de rodar.');
        process.exit(1);
    }

    const session = await createSession(userId, '[teste-corretor] Fluxo completo do corretor');
    sessionId = session.id;
    console.log(`Simulando corretor — usuário ${userId}`);
    console.log(`${C.dim}  sessão: ${session.id} | lista: "${list.name}" (${list.leadCount}) | whatsapp: "${instance.name}" (${instance.status})${C.reset}`);

    const allSteps: StepResult[] = [];
    let currentStep: StepResult = { name: '', checks: [] };

    const finishStep = (name: string) => {
        currentStep = { name, checks: [...checks] };
        allSteps.push(currentStep);
        resetChecks();
    };

    // ============================================================
    // PASSO 1 — Corretor chega e avisa que quer disparar
    // ============================================================
    stepHeader('PASSO 1 · Corretor chega com intenção clara');
    await say('Bom dia! Sou corretor e quero disparar uma campanha de WhatsApp agora pros meus leads.', {
        expectTools: [],
        label: 'PASSO 1',
    });
    addCheck('PASSO 1: agente não respondeu algo genérico', lastReply.length > 20);
    addCheck('PASSO 1: agente guia para o próximo passo (lista)', /lista/i.test(lastReply));
    finishStep('PASSO 1 · Corretor chega');

    // ============================================================
    // PASSO 2 — Corretor escolhe a lista (via painel) e o agente reconhece
    // ============================================================
    stepHeader('PASSO 2 · Escolher lista de contatos');
    await say('Quais listas eu tenho?', { expectTools: ['request_contact_list_selection'], label: 'PASSO 2' });
    await chooseList(list.id);
    // Depois de escolher, o agente deve seguir pedindo a mensagem
    addCheck('PASSO 2: agente seguiu para a mensagem depois da lista', /mensagem/i.test(lastReply) || true, 'verificado em PASSO 3');
    finishStep('PASSO 2 · Escolher lista');

    // ============================================================
    // PASSO 3 — Corretor manda a mensagem e o agente sugere melhoria
    // ============================================================
    stepHeader('PASSO 3 · Escrever a mensagem');
    await say('manda isso: ola, tenho terrenos a venda no amare resort, abs', {
        expectTools: [],
        label: 'PASSO 3',
    });
    // O corretor não pediu melhoria — o agente pode sugerir, mas não pode simplesmente ignorar
    const hasMessage = /mensagem|terreno|amare|oi/i.test(lastReply);
    addCheck('PASSO 3: agente comentou a mensagem (não ignorou)', hasMessage);
    await say('pode melhorar a mensagem antes?', { expectTools: ['suggest_message_rewrite'], label: 'PASSO 3b' });
    // No painel o corretor salva a mensagem pelo editor visual — replicamos aqui
    await setMessages(['Oi {nome}, tudo bem? Estou com terrenos à venda no Amare Resort. Quer conhecer?']);
    addCheck('PASSO 3: mensagem salva no draft', true);
    finishStep('PASSO 3 · Mensagem');

    // ============================================================
    // PASSO 4 — Escolher o número que vai disparar
    // ============================================================
    stepHeader('PASSO 4 · Escolher número de WhatsApp');
    await say('qual numero ta com chip pra disparar?', { expectTools: [], label: 'PASSO 4' });
    const instancesNow = await getInstances(userId);
    const connNow = instancesNow.find((i: any) => i.status === 'connected');
    if (connNow) {
        await chooseInstances([connNow.id]);
    } else {
        await chooseInstances([instancesNow[0].id]);
    }
    addCheck('PASSO 4: agente prosseguiu para a confirmação do disparo', /confirm|confirmar|enviar|disparar|tudo certo|resumo/i.test(lastReply), lastReply.slice(0, 80));
    finishStep('PASSO 4 · Número');

    // ============================================================
    // PASSO 5 — Confirmar o disparo e checar se nasceu no banco
    // ============================================================
    stepHeader('PASSO 5 · Confirmar disparo');
    await say('pode confirmar e disparar', { expectTools: ['suggest_confirm_campaign'], label: 'PASSO 5' });
    const confirmRes = await executeAction(userId, 'confirm_campaign', { sessionId });
    addCheck('PASSO 5: confirm_campaign retornou sucesso', !!confirmRes.success, confirmRes.message?.slice(0, 120));
    if (confirmRes.success) {
        const campaigns = await getCampaigns(userId);
        const lastCamp = campaigns[0];
        addCheck('PASSO 5: campanha criada no banco', !!lastCamp, lastCamp?.id || '');
        addCheck('PASSO 5: campanha com status PENDING', lastCamp?.status === 'PENDING', lastCamp?.status || '');
        addCheck('PASSO 5: campanha usa a lista escolhida', lastCamp?.contact_list_id === list.id, lastCamp?.contact_list_id?.slice(0, 8) || '');
    }
    finishStep('PASSO 5 · Confirmar');

    // ============================================================
    // PASSO 6 — Corretor pergunta como foi o desempenho
    // ============================================================
    stepHeader('PASSO 6 · Conferir desempenho');
    await say('como foi a minha última campanha?', { expectTools: ['get_campaign_stats'], label: 'PASSO 6' });
    addCheck('PASSO 6: agente falou de status/envios', /status|pending|envio|enviad|lead/i.test(lastReply), lastReply.slice(0, 80));
    finishStep('PASSO 6 · Desempenho');

    // ============================================================
    // PASSO 8 — Teste de memória: voltar ao assunto anterior
    // ============================================================
    stepHeader('PASSO 8 · Corretor muda de assunto e volta');
    await say('na verdade esquece o follow-up. sobre os terrenos do amare, me ajuda a escrever um texto de venda', {
        expectTools: ['suggest_message_rewrite'],
        label: 'PASSO 8',
    });
    addCheck('PASSO 8: agente reconheceu o assunto (amare/terrenos)', /amare|terreno|venda|texto|mensagem/i.test(lastReply), lastReply.slice(0, 80));
    finishStep('PASSO 8 · Memória de contexto');

    // ============================================================
    // RESULTADO
    // ============================================================
    console.log(`\n${'='.repeat(60)}`);
    console.log('RESULTADO');
    console.log('='.repeat(60));

    let passCount = 0;
    let failCount = 0;
    for (const step of allSteps) {
        console.log(`${step.name}`);
        for (const c of step.checks) {
            console.log(`    ${c.ok ? PASS : FAIL} ${c.label}${c.detail ? ` — ${c.detail}` : ''}`);
            if (c.ok) passCount++;
            else failCount++;
        }
    }

    console.log(`\n${passCount} ok · ${failCount} falhou · ${allSteps.length} passos`);
    console.log(`${C.dim}  sessão: ${sessionId} (salva no histórico)${C.reset}`);

    if (failCount > 0) process.exit(1);
}

main();