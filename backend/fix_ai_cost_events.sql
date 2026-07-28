-- Cria a tabela ai_cost_events, que registra o custo estimado de cada chamada
-- de IA (Groq/Gemini/OpenAI), usada pelo painel financeiro do admin.

create table if not exists ai_cost_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_id uuid references agent_sessions(id) on delete set null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(12,6) not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_ai_cost_events_user_id on ai_cost_events(user_id);
create index if not exists idx_ai_cost_events_created_at on ai_cost_events(created_at);

-- Só o backend (service role) lê/escreve nessa tabela — sem policy de usuário comum.
alter table ai_cost_events enable row level security;
