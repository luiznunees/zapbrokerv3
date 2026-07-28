-- Cria (ou corrige) a tabela agent_user_memory do zero, com RLS e policies.
-- Seguro rodar mesmo que parte já exista (tudo é idempotente).

create table if not exists agent_user_memory (
  user_id uuid primary key references users(id) on delete cascade,
  facts jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table agent_user_memory enable row level security;

drop policy if exists "Users can view their own agent memory" on agent_user_memory;
create policy "Users can view their own agent memory" on agent_user_memory for select using (auth.uid() = user_id);

drop policy if exists "Users can upsert their own agent memory" on agent_user_memory;
create policy "Users can upsert their own agent memory" on agent_user_memory for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own agent memory" on agent_user_memory;
create policy "Users can update their own agent memory" on agent_user_memory for update using (auth.uid() = user_id);
