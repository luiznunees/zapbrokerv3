// Teste completo do agente — roda conversas reais, mostra as respostas do agente
// em tempo real (streaming token a token), verifica as ferramentas que ele chamou,
// monta um disparo do início ao fim e confere no banco se a campanha foi criada.
//
// Requer AGENT_TEST_USER_ID no .env (usuário real existente, com ao menos 1 lista de
// contatos e 1 WhatsApp conectado).
// Roda com: npm run test:agent:e2e
//
// As conversas ficam SALVAS no histórico (não são apagadas) pra você reler depois
// no painel ou no dump.
//
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
    user: '\x1b[36m',      // ciano
    agent: '\x1b[32m',     // verde
    tool: '\x1b[33m',      // amarelo
    ok: '\x1b[32m',
    fail: '\x1b[31m',
    header: '\x1b[1;35m',  // magenta bold
};

const LEAK_PATTERNS = [
    /<function=[^>]*>/i,
    /<\|?tool_call\|?>/i,
    /\{\s*"type"\s*:\s*"function"/i,
    /\{\s*"function"\s*:/i,
];

interface Scenario {
    name: string;
    messages: string[];
}

const SCENARIOS: Scenario[] = [
    { name: 'Saudação simples', messages: ['oi'] },
    { name: 'Começar a usar o ZapBroker', messages: ['Quero criar uma campanha de disparo agora.'] },
    { name: 'Pedido vago de disparo', messages: ['quero mandar mensagem pros meus leads'] },
    { name: 'Desempenho de campanha', messages: ['como foi minha última campanha?'] },
    { name: 'Follow-up de leads parados', messages: ['quero mandar um lembrete pra quem não respondeu'] },
    { name: 'Pergunta sobre preço/objeção', messages: ['como eu respondo um lead que disse que tá caro?'] },
    { name: 'Conectar WhatsApp', messages: ['quero conectar um novo WhatsApp'] },
    { name: 'Reescrita de mensagem', messages: ['me ajuda a melhorar essa mensagem: "olá, tenho uma casa pra te mostrar"'] },
    { name: 'Importar leads', messages: ['como eu importo meus leads?'] },
];

const PASS_EMOJI = '✅';
const FAIL_EMOJI = '❌';

async function runScenario(scenario: Scenario): Promise<{ name: string; pass: boolean; reason?: string; replies: string[]; toolCalls: string[]; sessionId: string }> {
    const session = await createSession(userId, `[teste-e2e] ${scenario.name}`);
    const replies: string[] = [];
    const toolCalls: string[] = [];

    console.log(`${C.header}\n━━━ ${scenario.name} ━━━${C.reset}`);
    console.log(`${C.dim}  sessão: ${session.id}${C.reset}`);

    for (const message of scenario.messages) {
        console.log(`${C.user}\n  👤 você: ${message}${C.reset}`);

        let streamed = '';
        process.stdout.write(`${C.agent}  🤖 agente: `);
        const result = await chat(userId, message, [], session.id, (token) => {
            streamed += token;
            process.stdout.write(`${C.agent}${token}${C.reset}`);
        });
        process.stdout.write('\n');

        replies.push(result.reply);

        const [turn] = await getRecentAgentTurns(userId, session.id, 1);
        if (turn?.tool_calls) {
            turn.tool_calls.forEach((tc: any) => {
                toolCalls.push(`${tc.ok ? '✅' : '❌'} ${tc.name}`);
                console.log(`${C.tool}     ⚙ tool: ${tc.ok ? '✅' : '❌'} ${tc.name}${C.reset}`);
            });
        }
    }

    const lastReply = replies[replies.length - 1];
    if (!lastReply || !lastReply.trim()) {
        return { name: scenario.name, pass: false, reason: 'resposta final vazia', replies, toolCalls, sessionId: session.id };
    }

    for (const pattern of LEAK_PATTERNS) {
        if (pattern.test(lastReply)) {
            return { name: scenario.name, pass: false, reason: `vazamento de tool call (${pattern})`, replies, toolCalls, sessionId: session.id };
        }
    }

    return { name: scenario.name, pass: true, replies, toolCalls, sessionId: session.id };
}

async function fullCampaignFlow(): Promise<{ pass: boolean; reason?: string; steps: string[]; campaignId?: string }> {
    const steps: string[] = [];
    const session = await createSession(userId, '[teste-e2e] Fluxo completo de disparo');

    console.log(`${C.header}\n━━━ FLUXO COMPLETO DE DISPARO ━━━${C.reset}`);
    console.log(`${C.dim}  sessão: ${session.id}${C.reset}`);

    try {
        const lists = await getListsWithCounts(userId);
        const instances = await getInstances(userId);

        const list = lists[0];
        const instance = instances.find((i: any) => i.status === 'connected') || instances[0];

        if (!list) return { pass: false, reason: 'nenhuma lista de contatos', steps };
        if (!instance) return { pass: false, reason: 'nenhum WhatsApp conectado', steps };

        steps.push(`Lista de contatos: "${list.name}" (${list.leadCount} leads)`);
        steps.push(`WhatsApp: "${instance.name}" (${instance.status})`);
        console.log(`${C.tool}  Lista: "${list.name}" (${list.leadCount} leads) | WhatsApp: "${instance.name}" (${instance.status})${C.reset}`);

        const listRes = await executeAction(userId, 'set_draft_list', { sessionId: session.id, contactListId: list.id });
        if (!listRes.success) return { pass: false, reason: `set_draft_list falhou: ${listRes.message}`, steps };
        console.log(`${C.tool}  ✓ set_draft_list: ${listRes.message}${C.reset}`);

        const instanceRes = await executeAction(userId, 'set_draft_instances', { sessionId: session.id, instanceIds: [instance.id] });
        if (!instanceRes.success) return { pass: false, reason: `set_draft_instances falhou: ${instanceRes.message}`, steps };
        console.log(`${C.tool}  ✓ set_draft_instances: ${instanceRes.message}${C.reset}`);

        const msgRes = await executeAction(userId, 'set_draft_messages', {
            sessionId: session.id,
            messageVariations: ['Olá! Teste automático do agente — por favor ignore esta mensagem. 🧪'],
        });
        if (!msgRes.success) return { pass: false, reason: `set_draft_messages falhou: ${msgRes.message}`, steps };
        console.log(`${C.tool}  ✓ set_draft_messages: ${msgRes.message}${C.reset}`);

        const timingRes = await executeAction(userId, 'set_draft_timing', { sessionId: session.id });
        if (!timingRes.success) return { pass: false, reason: `set_draft_timing falhou: ${timingRes.message}`, steps };
        console.log(`${C.tool}  ✓ set_draft_timing: ${msgRes.message}${C.reset}`);

        const confirmRes = await executeAction(userId, 'confirm_campaign', { sessionId: session.id });
        if (!confirmRes.success) return { pass: false, reason: `confirm_campaign falhou: ${confirmRes.message}`, steps };
        steps.push(confirmRes.message);
        console.log(`${C.tool}  ✓ confirm_campaign: ${confirmRes.message}${C.reset}`);

        const campaigns = await getCampaigns(userId);
        const campaign = campaigns[0];
        if (!campaign) return { pass: false, reason: 'campanha não encontrada no banco após confirmar', steps };

        steps.push(`Campanha criada no banco: id=${campaign.id}, nome="${campaign.name}", status=${campaign.status}, lista=${campaign.contact_list_id}`);
        console.log(`${C.ok}  ✓ Campanha no banco: ${campaign.id} — "${campaign.name}" (${campaign.status})${C.reset}`);

        return { pass: true, steps, campaignId: campaign.id };
    } catch (error: any) {
        return { pass: false, reason: error.message, steps };
    }
}

async function main() {
    if (!userId) {
        console.error('❌ Defina AGENT_TEST_USER_ID no .env antes de rodar essa suite (veja .env.example).');
        process.exit(1);
    }

    console.log(`Teste do agente (e2e) — usuário ${userId}`);
    console.log(`Rodando ${SCENARIOS.length} cenários de conversa + 1 fluxo completo de disparo...\n`);

    const results = [];
    for (const scenario of SCENARIOS) {
        const result = await runScenario(scenario);
        results.push(result);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`FLUXO COMPLETO DE DISPARO`);
    console.log('='.repeat(60));
    const flow = await fullCampaignFlow();
    flow.steps.forEach((step) => console.log(`  ${step}`));
    if (!flow.pass) console.log(`  ${FAIL_EMOJI} Falhou: ${flow.reason}`);

    const failed = results.filter((r) => !r.pass);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`RESULTADO`);
    console.log('='.repeat(60));
    for (const r of results) {
        console.log(`${r.pass ? PASS_EMOJI : FAIL_EMOJI} ${r.name}${r.reason ? ` — ${r.reason}` : ''} ${r.pass ? '' : ''}`);
    }
    console.log(`\n${results.length - failed.length}/${results.length} cenários de conversa passaram. Fluxo de disparo: ${flow.pass ? '✅ OK' : '❌ falhou'}.`);
    console.log(`Campanha criada: ${flow.campaignId ? '✅ ' + flow.campaignId : 'não'}`);
    console.log(`\n💾 Conversas salvas no histórico — relê no painel ou rode um dump.`);

    if (failed.length > 0 || !flow.pass) {
        process.exit(1);
    }
}

main();