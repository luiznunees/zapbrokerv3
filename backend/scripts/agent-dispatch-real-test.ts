// Teste manual único: conversa com o agente de verdade (não insere direto no banco)
// pra confirmar que ele consegue montar e disparar uma campanha real via chat.
process.env.OPENROUTER_MODEL_OVERRIDE = process.env.OPENROUTER_MODEL_OVERRIDE || 'anthropic/claude-haiku-4.5';

const { chat, createSession, executeAction } = require('../src/services/agentService') as typeof import('../src/services/agentService');
const { getCampaigns } = require('../src/services/campaignService') as typeof import('../src/services/campaignService');

const userId = process.env.AGENT_TEST_USER_ID || 'ca5941ca-dcbd-475c-9ee6-e3de79ebd0f3';
const LIST_ID = '8cf06a17-2707-48b7-abef-73bd3b447de7'; // "Teste Disparo (ZapBroker)" — 1 contato: seu número
const INSTANCE_ID = '84993129-4e88-451e-80a4-030a1fb1b5d3'; // "teste" — conectada (open)

let sessionId = '';

async function say(msg: string) {
    console.log(`\n👤 corretor: ${msg}`);
    const result = await chat(userId, msg, [], sessionId);
    sessionId = result.sessionId;
    console.log(`🤖 agente: ${result.reply}`);
    return result;
}

async function main() {
    const session = await createSession(userId, '[teste-real] Validação de disparo via agente');
    sessionId = session.id;
    console.log(`sessão: ${sessionId}`);

    await say('Oi! Quero disparar uma campanha de teste agora pros meus leads.');
    await say('Usa a lista "Teste Disparo (ZapBroker)"');

    const r1 = await executeAction(userId, 'set_draft_list', { sessionId, contactListId: LIST_ID });
    console.log('[painel] lista selecionada:', r1.message);

    const r2 = await executeAction(userId, 'set_draft_messages', {
        sessionId,
        messageVariations: ['Oi {nome}! Teste real via AGENTE do ZapBroker — se chegou, o fluxo completo (chat -> disparo) funciona 🎉'],
    });
    console.log('[painel] mensagem salva:', r2.message);

    const r3 = await executeAction(userId, 'set_draft_instances', { sessionId, instanceIds: [INSTANCE_ID] });
    console.log('[painel] instância selecionada:', r3.message);

    const r4 = await executeAction(userId, 'set_draft_timing', { sessionId });
    console.log('[painel] timing confirmado:', r4.message);

    const confirmRes = await executeAction(userId, 'confirm_campaign', { sessionId });
    console.log('\n[painel] confirm_campaign:', JSON.stringify(confirmRes));

    if (confirmRes.success) {
        const campaigns = await getCampaigns(userId);
        console.log('\nÚltima campanha:', JSON.stringify(campaigns[0], null, 2));
    }

    process.exit(0);
}

main().catch((err) => {
    console.error('ERRO:', err);
    process.exit(1);
});
