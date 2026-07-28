-- ============================================================
-- Setup: agent_sessions + agent_messages.session_id
-- Execute tudo no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Helper function para DDL via API (permite auto-migrate no startup)
create or replace function exec_sql(sql text)
returns void
language plpgsql
security definer
as $$
begin
  execute sql;
end;
$$;

-- 2. Tabela agent_sessions
create table if not exists agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  title text not null default 'Nova conversa',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. session_id em agent_messages
alter table agent_messages add column if not exists session_id uuid references agent_sessions(id) on delete cascade;

-- 3b. Rascunho de disparo em andamento (skill conversacional)
alter table agent_sessions add column if not exists draft_campaign jsonb;

-- 4. Índices
create index if not exists idx_agent_sessions_user_id on agent_sessions(user_id);
create index if not exists idx_agent_messages_session_id on agent_messages(session_id);

-- 5. RLS
alter table agent_sessions enable row level security;

drop policy if exists "Users can view their own agent sessions" on agent_sessions;
create policy "Users can view their own agent sessions"
  on agent_sessions for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own agent sessions" on agent_sessions;
create policy "Users can insert their own agent sessions"
  on agent_sessions for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own agent sessions" on agent_sessions;
create policy "Users can delete their own agent sessions"
  on agent_sessions for delete using (auth.uid() = user_id);

drop policy if exists "Users can update their own agent sessions" on agent_sessions;
create policy "Users can update their own agent sessions"
  on agent_sessions for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own agent messages" on agent_messages;
create policy "Users can delete their own agent messages"
  on agent_messages for delete using (auth.uid() = user_id);
