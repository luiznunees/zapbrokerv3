-- Prompt caching (Anthropic via OpenRouter): registra quantos tokens do prompt vieram do
-- cache (leitura, 0,1x) e quantos foram escritos nele (1,25x), pra o custo em cost_usd
-- refletir o preço real e o painel admin conseguir medir a economia.
-- input_tokens continua sendo o total do prompt (já inclui essas duas parcelas).

alter table ai_cost_events add column if not exists cached_tokens integer not null default 0;
alter table ai_cost_events add column if not exists cache_write_tokens integer not null default 0;
