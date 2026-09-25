# Plano — reduzir custo de IA do agente

Criado em 25/09/2026. Motivo: a Fernanda (beta) gastou R$ 15,69 em ~8 dias
(~R$ 60/mês projetado) contra planos de R$ 39 (Starter) e R$ 79 (Pro).

## Diagnóstico

- Modelo: `anthropic/claude-haiku-4.5` via OpenRouter (US$ 1/M input, US$ 5/M output).
- Cada chamada ao LLM leva ~16–18k tokens fixos: system prompt (~23k chars) +
  `AGENT_TOOLS` (~38k chars) + até 20 mensagens de histórico.
- Um turno pode fazer até 5 chamadas (`MAX_TOOL_ITERATIONS`), todas pagando tudo cheio.
- Zero prompt caching — e o prompt começava com as partes dinâmicas (contexto,
  rascunho, memória), então nem daria pra cachear do jeito que estava.

## Fase 1 — Prompt caching (maior alavanca)

- [x] 1.1 Separar `buildSystemPrompt` em bloco estático (regras, tools, tom) e
      bloco dinâmico (contexto do usuário, rascunho, memória, campanhas, sessões).
      Estático primeiro.
- [x] 1.2 Mandar o system como array de content parts, com
      `cache_control: { type: 'ephemeral' }` no bloco estático (só no OpenRouter/Anthropic;
      Mistral continua recebendo string). Cacheia tools + regras juntas.
- [x] 1.3 Registrar tokens de cache (`cached_tokens`, `cache_write_tokens`) em
      `ai_cost_events` e precificar leitura (0,1x) e escrita (1,25x) em `aiPricing.ts`.
- [x] 1.4 Logar custo também na chamada forçada de texto (hoje fica fora do painel).
- Validação: 3 mensagens seguidas numa conta de teste → a partir da 2ª chamada,
  ~16k tokens devem vir como `cached_tokens`.
- Resultado medido (25/09, scripts/check-prompt-cache.ts): bloco fixo real = ~10,6k tokens;
  chamada com cache hit custa US$ 0,0015 vs US$ 0,011 sem cache (-86%). Regressão 11/11 ok.
- **Deploy: rodar `backend/migrations/ai_cost_events_cache_tokens.sql` no Supabase** (sem ela o
  log continua funcionando, só não grava as colunas de cache).

## Fase 4 — Custo x receita por usuário

- [ ] 4.1 `getCostSummary` cruza custo por usuário com o plano e calcula % da assinatura gasta em IA.
- [ ] 4.2 Painel admin/finance: plano, valor pago, % IA (amarelo > 30%, vermelho > 50%).
- [ ] 4.3 Alerta no Discord quando alguém passar de 50% no mês.
- [ ] 4.4 Custo médio por mensagem do agente (métrica pra validar Fases 1 e 2).

## Fase 2 — Mandar menos contexto por turno

- [ ] 2.1 Histórico de 20 → ~10 mensagens + resumo curto das anteriores salvo na sessão.
- [ ] 2.2 Truncar resultados de tools grandes (listas/campanhas) pros N primeiros + total.
- [ ] 2.3 Enxugar descrições de `AGENT_TOOLS` sem mudar comportamento.
- [ ] 2.4 Medir `agent_turn_logs.iterations`; se média > 2, atacar tools redundantes.
- Validação obrigatória: `backend/scripts/agent-regression.ts` antes e depois
  (cortar contexto pode reabrir os bugs de "confirmou sem checar").

Ordem: 1 → 4 → 2.
