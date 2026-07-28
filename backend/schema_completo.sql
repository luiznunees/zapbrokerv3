-- ZapBroker Database Schema (Consolidated)
-- Generated from individual migrations. Do not edit individual SQL files.

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. ENUMS
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_status') then
    create type campaign_status as enum ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED');
  else
    alter type campaign_status add value if not exists 'PAUSED';
  end if;
end$$;

-- ============================================================
-- 3. TABLES
-- ============================================================

-- 3.1 Users (profiles)
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password text not null,
  role text default 'user',
  onboarding_steps jsonb default '{}',
  first_message_sent boolean default false,
  created_at timestamp with time zone default now()
);

-- 3.2 WhatsApp instances
create table if not exists instances (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  status text default 'disconnected',
  evolution_id text,
  phone_number text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3.3 Contact lists
create table if not exists contact_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

-- 3.4 Contacts
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references contact_lists(id) on delete cascade,
  name text not null,
  phone text not null,
  status varchar(50) default 'New',
  last_interaction_at timestamp with time zone,
  unread_count integer default 0,
  created_at timestamp with time zone default now()
);

-- 3.5 Campaigns
create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  instance_id uuid references instances(id) on delete set null,
  contact_list_id uuid references contact_lists(id) on delete set null,
  name text not null,
  message text not null,
  status text default 'PENDING',
  scheduled_at timestamp with time zone,
  media_type varchar(20) default 'text',
  media_url text,
  message_variations jsonb,
  sequential_mode boolean default false,
  message_blocks jsonb,
  block_delay integer default 5,
  delay_seconds integer default 5,
  batch_size integer default 30,
  batch_delay_seconds integer default 60,
  last_message_at timestamp with time zone,
  batch_counter integer default 0,
  created_at timestamp with time zone default now()
);

-- 3.6 Campaign messages (dispatch logs)
create table if not exists campaign_messages (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  evolution_message_id text,
  status text default 'PENDING',
  error_message text,
  lead_status varchar(50) default 'PENDING',
  updated_at timestamp with time zone default now()
);

-- 3.7 Messages (inbox / chat history)
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  contact_id uuid references contacts(id) on delete cascade,
  instance_id uuid references instances(id),
  evolution_id varchar(255),
  remote_jid varchar(255),
  from_me boolean default false,
  type varchar(50) default 'text',
  content text,
  media_url text,
  created_at timestamp with time zone default now(),
  is_read boolean default false
);

-- 3.8 Plans
create table if not exists plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price decimal(10,2) not null,
  credits integer default 0,
  features jsonb default '[]',
  created_at timestamp with time zone default now()
);

-- 3.9 Subscriptions
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  plan_id text not null,
  status text not null default 'active',
  start_date timestamp with time zone default now(),
  next_billing_date timestamp with time zone,
  gateway_subscription_id text,
  stripe_customer_id text,
  trial_ends_at timestamp with time zone,
  pix_cpf text,
  pix_cellphone text,
  pending_checkout_id text,
  pending_checkout_url text,
  pending_checkout_qrcode text,
  pending_checkout_brcode text,
  pending_checkout_expires_at timestamp with time zone,
  last_reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3.10 Payments
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  subscription_id uuid references subscriptions(id),
  external_id text not null,
  amount integer not null,
  status text not null default 'PENDING',
  method text not null default 'PIX',
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3.11 Weekly quotas
create table if not exists weekly_quotas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  plan_limit integer not null,
  messages_used integer default 0,
  messages_remaining integer not null,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'EXPIRED')),
  created_at timestamp with time zone default now(),
  unique(user_id, week_start)
);

-- 3.12 Quota transactions
create table if not exists quota_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  weekly_quota_id uuid not null references weekly_quotas(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  message_count integer not null,
  type text not null check (type in ('USAGE', 'RENEWAL', 'REFUND')),
  reason text,
  created_at timestamp with time zone default now()
);

-- 3.13 User settings
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references users(id) on delete cascade,
  email_notifications boolean default true,
  quota_alerts boolean default true,
  theme text default 'light',
  language text default 'pt-BR',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3.14 Admin invites
create table if not exists admin_invites (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  plan_id text,
  created_by uuid references users(id),
  used_by uuid references users(id),
  used_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 3.15 Agent sessions (AI chat grouping)
create table if not exists agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  title text not null default 'Nova conversa',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3.16 Agent messages (AI chat)
create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references agent_sessions(id) on delete cascade,
  user_id uuid references users(id) not null,
  role text not null check (role in ('user', 'agent')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 3.17 Agent user memory (fatos duradouros que o agente lembra sobre o corretor)
create table if not exists agent_user_memory (
  user_id uuid primary key references users(id) on delete cascade,
  facts jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- 3.18 AI cost events (custo estimado de cada chamada de IA, pro painel financeiro)
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

-- Colunas adicionadas depois da criação inicial das tabelas acima
alter table agent_sessions add column if not exists draft_campaign jsonb;
alter table subscriptions add column if not exists pix_cpf text;
alter table subscriptions add column if not exists pix_cellphone text;

-- ============================================================
-- 4. INDEXES
-- ============================================================
create index if not exists idx_instances_user_id on instances(user_id);
create index if not exists idx_instances_phone_number on instances(phone_number);
create index if not exists idx_contact_lists_user_id on contact_lists(user_id);
create index if not exists idx_contacts_list_id on contacts(list_id);
create index if not exists idx_contacts_phone on contacts(phone);
create index if not exists idx_campaigns_user_id on campaigns(user_id);
create index if not exists idx_campaigns_status on campaigns(status);
create index if not exists idx_campaigns_scheduled_at on campaigns(scheduled_at);
create index if not exists idx_campaign_messages_campaign_id on campaign_messages(campaign_id);
create index if not exists idx_campaign_messages_lead_status on campaign_messages(lead_status);
create index if not exists idx_campaign_messages_campaign_id_lead_status on campaign_messages(campaign_id, lead_status);
create index if not exists idx_messages_contact_id on messages(contact_id);
create index if not exists idx_messages_created_at on messages(created_at desc);
create index if not exists idx_messages_remote_jid on messages(remote_jid);
create index if not exists idx_weekly_quotas_user_week on weekly_quotas(user_id, week_start);
create index if not exists idx_weekly_quotas_status on weekly_quotas(status);
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_subscriptions_trial_ends_at on subscriptions(trial_ends_at) where status = 'active';
create index if not exists idx_payments_user_id on payments(user_id);
create index if not exists idx_payments_subscription_id on payments(subscription_id);
create index if not exists idx_agent_sessions_user_id on agent_sessions(user_id);
create index if not exists idx_agent_messages_user_id on agent_messages(user_id);
create index if not exists idx_agent_messages_session_id on agent_messages(session_id);
create index if not exists idx_ai_cost_events_user_id on ai_cost_events(user_id);
create index if not exists idx_ai_cost_events_created_at on ai_cost_events(created_at);
create index if not exists idx_agent_messages_created_at on agent_messages(created_at desc);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
alter table settings enable row level security;
alter table weekly_quotas enable row level security;
alter table quota_transactions enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table agent_sessions enable row level security;
alter table agent_messages enable row level security;
alter table agent_user_memory enable row level security;
-- ai_cost_events: só o backend (service role) lê/escreve — sem policy pra usuário comum de propósito.
alter table ai_cost_events enable row level security;

-- Settings
drop policy if exists "Users can view their own settings" on settings;
create policy "Users can view their own settings" on settings for select using (auth.uid() = user_id);
drop policy if exists "Users can update their own settings" on settings;
create policy "Users can update their own settings" on settings for update using (auth.uid() = user_id);
drop policy if exists "Users can insert their own settings" on settings;
create policy "Users can insert their own settings" on settings for insert with check (auth.uid() = user_id);

-- Quotas
drop policy if exists "Users can view their own quotas" on weekly_quotas;
create policy "Users can view their own quotas" on weekly_quotas for select using (auth.uid() = user_id);
drop policy if exists "Users can view their own transactions" on quota_transactions;
create policy "Users can view their own transactions" on quota_transactions for select using (auth.uid() = user_id);

-- Subscriptions
drop policy if exists "Users can view their own subscriptions" on subscriptions;
create policy "Users can view their own subscriptions" on subscriptions for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own subscriptions" on subscriptions;
create policy "Users can insert their own subscriptions" on subscriptions for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own subscriptions" on subscriptions;
create policy "Users can update their own subscriptions" on subscriptions for update using (auth.uid() = user_id);

-- Payments
drop policy if exists "Users can view their own payments" on payments;
create policy "Users can view their own payments" on payments for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own payments" on payments;
create policy "Users can insert their own payments" on payments for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own payments" on payments;
create policy "Users can update their own payments" on payments for update using (auth.uid() = user_id);

-- Agent sessions
drop policy if exists "Users can view their own agent sessions" on agent_sessions;
create policy "Users can view their own agent sessions" on agent_sessions for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own agent sessions" on agent_sessions;
create policy "Users can insert their own agent sessions" on agent_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own agent sessions" on agent_sessions;
create policy "Users can delete their own agent sessions" on agent_sessions for delete using (auth.uid() = user_id);
drop policy if exists "Users can update their own agent sessions" on agent_sessions;
create policy "Users can update their own agent sessions" on agent_sessions for update using (auth.uid() = user_id);

-- Agent messages
drop policy if exists "Users can view their own agent messages" on agent_messages;
create policy "Users can view their own agent messages" on agent_messages for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own agent messages" on agent_messages;
create policy "Users can insert their own agent messages" on agent_messages for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own agent messages" on agent_messages;
create policy "Users can delete their own agent messages" on agent_messages for delete using (auth.uid() = user_id);

-- Agent user memory
drop policy if exists "Users can view their own agent memory" on agent_user_memory;
create policy "Users can view their own agent memory" on agent_user_memory for select using (auth.uid() = user_id);
drop policy if exists "Users can upsert their own agent memory" on agent_user_memory;
create policy "Users can upsert their own agent memory" on agent_user_memory for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own agent memory" on agent_user_memory;
create policy "Users can update their own agent memory" on agent_user_memory for update using (auth.uid() = user_id);

-- ============================================================
-- 6. PERMISSIONS
-- ============================================================
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;