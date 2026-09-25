// Verifica se o prompt caching do agente está pegando de verdade: faz 2 chamadas curtas
// seguidas com o mesmo bloco fixo (tools + STABLE_SYSTEM_PROMPT) e mostra os tokens de cache.
// Esperado: 1ª chamada com cache_write_tokens > 0, 2ª com cached_tokens > 0.
// Uso: npx ts-node scripts/check-prompt-cache.ts  (custa alguns centavos de dólar)
import 'dotenv/config';
import { AGENT_TOOLS, STABLE_SYSTEM_PROMPT } from '../src/services/agentService';
import { estimateCostUsd } from '../src/config/aiPricing';

const MODEL = process.env.OPENROUTER_MODEL_OVERRIDE || 'anthropic/claude-haiku-4.5';

async function call(label: string, userText: string) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: [
                        { type: 'text', text: STABLE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
                        { type: 'text', text: `CONTEXTO DESTA CONVERSA (muda a cada turno):\n\nteste de cache ${Date.now()}` },
                    ],
                },
                { role: 'user', content: userText },
            ],
            tools: AGENT_TOOLS,
            tool_choice: 'none',
            max_tokens: 20,
        }),
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    const u = data.usage || {};
    const cached = u.prompt_tokens_details?.cached_tokens || 0;
    const written = u.prompt_tokens_details?.cache_write_tokens || 0;
    const withCache = estimateCostUsd(MODEL, u.prompt_tokens, u.completion_tokens, cached, written);
    const withoutCache = estimateCostUsd(MODEL, u.prompt_tokens, u.completion_tokens);
    console.log(`${label}: prompt=${u.prompt_tokens} cached=${cached} cache_write=${written} custo=US$${withCache.toFixed(5)} (sem cache seria US$${withoutCache.toFixed(5)})`);
}

(async () => {
    await call('1ª chamada', 'oi');
    await call('2ª chamada', 'tudo bem?');
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
