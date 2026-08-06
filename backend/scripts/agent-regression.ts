// Suite de regressão do agente — roda cenários fixos contra o agente de verdade (sem mock,
// custo real de poucos centavos em tokens por rodada) e confirma que não volta a acontecer
// nenhum dos bugs reais já encontrados (loop infinito, resposta vazia, vazamento de JSON).
//
// Requer AGENT_TEST_USER_ID no .env — um usuário real já existente no banco.
// Roda com: npm run test:agent

import { chat, createSession, deleteSession } from '../src/services/agentService';
import { getRecentAgentTurns } from '../src/services/agentLogService';

const userId = process.env.AGENT_TEST_USER_ID;

// Mesmo padrão de detecção de vazamento usado em stripLeakedToolSyntax (agentService.ts) —
// se algum desses aparecer na resposta final, é sinal de que o filtro de segurança falhou.
const LEAK_PATTERNS = [
  /<function=[^>]*>/i,
  /<\|?tool_call\|?>/i,
  /\{\s*"type"\s*:\s*"function"/i,
  /\{\s*"function"\s*:/i,
];

interface Scenario {
  name: string;
  messages: string[];
  expectNoIterationLimit?: boolean;
}

const SCENARIOS: Scenario[] = [
  { name: 'Saudação simples', messages: ['oi'] },
  { name: 'Começar a usar o ZapBroker (regressão do loop infinito)', messages: ['Quero criar uma campanha de disparo agora.'], expectNoIterationLimit: true },
  { name: 'Pedido vago de disparo', messages: ['quero mandar mensagem pros meus leads'], expectNoIterationLimit: true },
  { name: 'Criar campanha passo a passo', messages: ['quero fazer um disparo', 'manda pra minha lista de contatos'] },
  { name: 'Desempenho de campanha antiga', messages: ['como foi minha última campanha?'] },
  { name: 'Follow-up de leads parados', messages: ['quero mandar um lembrete pra quem não respondeu'] },
  { name: 'Lembrar um fato', messages: ['só uso o WhatsApp pra responder lead, não pra uso pessoal'] },
  { name: 'Pergunta fora do fluxo de disparo', messages: ['como eu respondo um lead que disse que tá caro?'] },
  { name: 'Cancelar disparo', messages: ['cancela o disparo que eu tava montando'] },
  { name: 'Conectar WhatsApp', messages: ['quero conectar um novo WhatsApp'] },
];

async function runScenario(scenario: Scenario): Promise<{ name: string; pass: boolean; reason?: string }> {
  if (!userId) return { name: scenario.name, pass: false, reason: 'AGENT_TEST_USER_ID não configurado' };

  const session = await createSession(userId, `[regressão] ${scenario.name}`);
  try {
    let lastReply = '';
    for (const message of scenario.messages) {
      const result = await chat(userId, message, [], session.id);
      lastReply = result.reply;
    }

    if (!lastReply || !lastReply.trim()) {
      return { name: scenario.name, pass: false, reason: 'resposta final vazia' };
    }

    for (const pattern of LEAK_PATTERNS) {
      if (pattern.test(lastReply)) {
        return { name: scenario.name, pass: false, reason: `vazamento de tool call na resposta (${pattern})` };
      }
    }

    if (scenario.expectNoIterationLimit) {
      const [turn] = await getRecentAgentTurns(userId, session.id, 1);
      if (turn?.hit_iteration_limit) {
        return { name: scenario.name, pass: false, reason: 'bateu no limite de iterações (loop infinito)' };
      }
    }

    return { name: scenario.name, pass: true };
  } catch (error: any) {
    return { name: scenario.name, pass: false, reason: error.message };
  } finally {
    // Não deixa sessão de teste sobrando no histórico.
    await deleteSession(userId, session.id).catch(() => {});
  }
}

async function main() {
  if (!userId) {
    console.error('❌ Defina AGENT_TEST_USER_ID no .env antes de rodar essa suite (veja .env.example).');
    process.exit(1);
  }

  console.log(`Rodando ${SCENARIOS.length} cenários de regressão do agente...\n`);

  const results = [];
  for (const scenario of SCENARIOS) {
    process.stdout.write(`  ${scenario.name}... `);
    const result = await runScenario(scenario);
    console.log(result.pass ? '✅' : `❌ (${result.reason})`);
    results.push(result);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passaram.`);

  if (failed.length > 0) {
    console.log('\nFalhas:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.reason}`));
    process.exit(1);
  }
}

main();
