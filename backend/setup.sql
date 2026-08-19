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

-- ============================================================
-- 6. Números dedicados (Salvy) + SMS recebidos
-- ============================================================
create table if not exists dedicated_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  salvy_id text,
  phone_number text,
  area_code integer,
  status text not null default 'pending_payment',
  canceled_at timestamptz,
  pending_checkout_id text,
  pending_checkout_qrcode text,
  pending_checkout_brcode text,
  pending_checkout_expires_at timestamptz,
  created_at timestamptz default now()
);

-- Upgrade para quem já criou a tabela com o schema antigo (phone_number not null, status default 'active')
alter table dedicated_numbers alter column phone_number drop not null;
alter table dedicated_numbers alter column status set default 'pending_payment';
alter table dedicated_numbers add column if not exists pending_checkout_id text;
alter table dedicated_numbers add column if not exists pending_checkout_qrcode text;
alter table dedicated_numbers add column if not exists pending_checkout_brcode text;
alter table dedicated_numbers add column if not exists pending_checkout_expires_at timestamptz;

create index if not exists idx_dedicated_numbers_user_id on dedicated_numbers(user_id);
create index if not exists idx_dedicated_numbers_salvy_id on dedicated_numbers(salvy_id);

alter table dedicated_numbers enable row level security;

drop policy if exists "Users can view their own dedicated numbers" on dedicated_numbers;
create policy "Users can view their own dedicated numbers"
  on dedicated_numbers for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own dedicated numbers" on dedicated_numbers;
create policy "Users can insert their own dedicated numbers"
  on dedicated_numbers for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own dedicated numbers" on dedicated_numbers;
create policy "Users can update their own dedicated numbers"
  on dedicated_numbers for update using (auth.uid() = user_id);

create table if not exists dedicated_number_sms (
  id uuid primary key default gen_random_uuid(),
  dedicated_number_id uuid references dedicated_numbers(id) on delete cascade not null,
  salvy_sms_id text,
  body text,
  origin text,
  verification_code text,
  received_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_dedicated_number_sms_number on dedicated_number_sms(dedicated_number_id);

alter table dedicated_number_sms enable row level security;

drop policy if exists "Users can view their own dedicated number sms" on dedicated_number_sms;
create policy "Users can view their own dedicated number sms"
  on dedicated_number_sms for select using (
    auth.uid() = (select user_id from dedicated_numbers where id = dedicated_number_id)
  );
