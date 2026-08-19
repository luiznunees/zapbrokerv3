import { supabase } from '../config/supabase';

const SQL = `
create table if not exists agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  title text not null default 'Nova conversa',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table agent_messages add column if not exists session_id uuid references agent_sessions(id) on delete cascade;

create index if not exists idx_agent_sessions_user_id on agent_sessions(user_id);
create index if not exists idx_agent_messages_session_id on agent_messages(session_id);

alter table agent_sessions enable row level security;

drop policy if exists "Users can view their own agent sessions" on agent_sessions;
create policy "Users can view their own agent sessions" on agent_sessions
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own agent sessions" on agent_sessions;
create policy "Users can insert their own agent sessions" on agent_sessions
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own agent sessions" on agent_sessions;
create policy "Users can delete their own agent sessions" on agent_sessions
  for delete using (auth.uid() = user_id);
drop policy if exists "Users can update their own agent sessions" on agent_sessions;
create policy "Users can update their own agent sessions" on agent_sessions
  for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own agent messages" on agent_messages;
create policy "Users can delete their own agent messages" on agent_messages
  for delete using (auth.uid() = user_id);
`;

const DRAFT_CAMPAIGN_SQL = `
alter table agent_sessions add column if not exists draft_campaign jsonb;
`;

const PIX_SUBSCRIPTION_SQL = `
alter table subscriptions add column if not exists pix_cpf text;
alter table subscriptions add column if not exists pix_cellphone text;
`;

const MANUAL_PIX_BILLING_SQL = `
alter table subscriptions add column if not exists pending_checkout_id text;
alter table subscriptions add column if not exists pending_checkout_url text;
alter table subscriptions add column if not exists last_reminder_sent_at timestamptz;
`;

const TRANSPARENT_CHECKOUT_SQL = `
alter table subscriptions add column if not exists pending_checkout_qrcode text;
alter table subscriptions add column if not exists pending_checkout_brcode text;
alter table subscriptions add column if not exists pending_checkout_expires_at timestamptz;
`;

const RENAME_PLAN_IDS_SQL = `
update subscriptions set plan_id = 'starter' where plan_id = 'prod_01j4WfgzmZjZWYspH4RCQFhj';
update subscriptions set plan_id = 'pro' where plan_id = 'prod_Uqr4bMTSyUYQuSwBdX4JTsmz';
update admin_invites set plan_id = 'starter' where plan_id = 'prod_01j4WfgzmZjZWYspH4RCQFhj';
update admin_invites set plan_id = 'pro' where plan_id = 'prod_Uqr4bMTSyUYQuSwBdX4JTsmz';
`;

const SYSTEM_EVENTS_SQL = `
create table if not exists system_events (
    id uuid primary key default gen_random_uuid(),
    type text not null,
    severity text not null default 'info',
    message text not null,
    user_id uuid references users(id) on delete set null,
    metadata jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_system_events_created_at on system_events(created_at desc);
create index if not exists idx_system_events_severity on system_events(severity);
`;

const AI_COST_EVENTS_SQL = `
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
alter table ai_cost_events enable row level security;
`;

const USER_MEMORY_SQL = `
create table if not exists agent_user_memory (
  user_id uuid primary key references users(id) on delete cascade,
  facts jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table agent_user_memory enable row level security;

drop policy if exists "Users can view their own agent memory" on agent_user_memory;
create policy "Users can view their own agent memory" on agent_user_memory
  for select using (auth.uid() = user_id);
drop policy if exists "Users can upsert their own agent memory" on agent_user_memory;
create policy "Users can upsert their own agent memory" on agent_user_memory
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own agent memory" on agent_user_memory;
create policy "Users can update their own agent memory" on agent_user_memory
  for update using (auth.uid() = user_id);
`;

// Log estruturado por turno do agente (não por chamada de LLM individual, isso já existe em
// ai_cost_events) — quais tools foram chamadas, quantas iterações, se bateu no limite de
// segurança. Sem isso, todo bug do agente (loop infinito, resposta vazia) só aparecia
// reproduzindo ao vivo; com isso dá pra auditar depois e a suite de regressão consegue
// verificar hit_iteration_limit direto em vez de adivinhar pelo texto da resposta.
const AGENT_TURN_LOGS_SQL = `
create table if not exists agent_turn_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_id uuid references agent_sessions(id) on delete set null,
  user_message text,
  tool_calls jsonb not null default '[]'::jsonb,
  iterations integer not null default 0,
  hit_iteration_limit boolean not null default false,
  final_reply text,
  provider text,
  model text,
  created_at timestamptz default now()
);

create index if not exists idx_agent_turn_logs_user_id on agent_turn_logs(user_id);
create index if not exists idx_agent_turn_logs_session_id on agent_turn_logs(session_id);
create index if not exists idx_agent_turn_logs_created_at on agent_turn_logs(created_at);
alter table agent_turn_logs enable row level security;

drop policy if exists "Users can view their own agent turn logs" on agent_turn_logs;
create policy "Users can view their own agent turn logs" on agent_turn_logs
  for select using (auth.uid() = user_id);
`;

const DEDICATED_NUMBERS_SQL = `
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

create index if not exists idx_dedicated_numbers_user_id on dedicated_numbers(user_id);
create index if not exists idx_dedicated_numbers_salvy_id on dedicated_numbers(salvy_id);

alter table dedicated_numbers enable row level security;

drop policy if exists "Users can view their own dedicated numbers" on dedicated_numbers;
create policy "Users can view their own dedicated numbers" on dedicated_numbers
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own dedicated numbers" on dedicated_numbers;
create policy "Users can insert their own dedicated numbers" on dedicated_numbers
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own dedicated numbers" on dedicated_numbers;
create policy "Users can update their own dedicated numbers" on dedicated_numbers
  for update using (auth.uid() = user_id);

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
create policy "Users can view their own dedicated number sms" on dedicated_number_sms
  for select using (auth.uid() = (select user_id from dedicated_numbers where id = dedicated_number_id));
`;

const CAMPAIGN_INSTANCES_SQL = `
create table if not exists campaign_instances (
    campaign_id uuid not null references campaigns(id) on delete cascade,
    instance_id uuid not null references instances(id) on delete cascade,
    position int not null default 0,
    primary key (campaign_id, instance_id)
);

create index if not exists idx_campaign_instances_campaign on campaign_instances(campaign_id);
`;

const PUSH_SUBSCRIPTIONS_SQL = `
alter table users add column if not exists last_active_at timestamptz;
alter table users add column if not exists last_reengagement_at timestamptz;

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  last_sent_at timestamptz,
  unique (endpoint)
);

create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "Users can view their own push subscriptions" on push_subscriptions;
create policy "Users can view their own push subscriptions" on push_subscriptions
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own push subscriptions" on push_subscriptions;
create policy "Users can insert their own push subscriptions" on push_subscriptions
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own push subscriptions" on push_subscriptions;
create policy "Users can delete their own push subscriptions" on push_subscriptions
  for delete using (auth.uid() = user_id);
`;

export async function runMigrations() {
  console.log('[Migrations] Verificando tabela agent_sessions...');

  try {
    const { error: checkError } = await supabase
      .from('agent_sessions')
      .select('id')
      .limit(1);

    if (checkError && checkError.message?.includes('Could not find the table')) {
      console.log('[Migrations] agent_sessions não encontrada. Tentando criar via RPC exec_sql...');

      const { error: rpcError } = await supabase.rpc('exec_sql', { sql: SQL });

      if (rpcError) {
        console.warn('[Migrations] Não foi possível criar automaticamente.');
        console.warn('[Migrations] Crie a função exec_sql e as tabelas manualmente:');
        console.warn('[Migrations]  1. Abra o SQL Editor no Supabase Dashboard');
        console.warn('[Migrations]  2. Execute o conteúdo do arquivo backend/setup.sql');
        console.warn('[Migrations]  3. Reinicie o servidor');
      } else {
        console.log('[Migrations] agent_sessions criada com sucesso!');
      }
    } else {
      console.log('[Migrations] agent_sessions já existe.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar tabela:', err.message);
    console.warn('[Migrations] Execute backend/setup.sql no Supabase SQL Editor.');
  }

  // Coluna draft_campaign — roda sempre (idempotente), independente da tabela já existir ou não
  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: DRAFT_CAMPAIGN_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível adicionar draft_campaign automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente: alter table agent_sessions add column if not exists draft_campaign jsonb;');
    } else {
      console.log('[Migrations] Coluna draft_campaign verificada/criada.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar coluna draft_campaign:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: PIX_SUBSCRIPTION_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível adicionar colunas PIX automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente: alter table subscriptions add column if not exists pix_cpf text, add column if not exists pix_cellphone text;');
    } else {
      console.log('[Migrations] Colunas pix_cpf/pix_cellphone verificadas/criadas.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar colunas PIX:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: MANUAL_PIX_BILLING_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível adicionar colunas de PIX manual mensal automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente: backend/migrations/manual_pix_billing_fields.sql');
    } else {
      console.log('[Migrations] Colunas de PIX manual mensal (pending_checkout_id/url, last_reminder_sent_at) verificadas/criadas.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar colunas de PIX manual mensal:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: TRANSPARENT_CHECKOUT_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível adicionar colunas de checkout transparente automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente: backend/migrations/manual_pix_billing_fields.sql');
    } else {
      console.log('[Migrations] Colunas de checkout transparente (pending_checkout_qrcode/brcode/expires_at) verificadas/criadas.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar colunas de checkout transparente:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: RENAME_PLAN_IDS_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível renomear plan_id automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente: backend/migrations/rename_plan_ids.sql');
    } else {
      console.log('[Migrations] plan_id renomeado de prod_... para starter/pro (subscriptions/admin_invites).');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao renomear plan_id:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: SYSTEM_EVENTS_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível criar system_events automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente: backend/migrations/system_events.sql');
    } else {
      console.log('[Migrations] Tabela system_events verificada/criada.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar system_events:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: AI_COST_EVENTS_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível criar ai_cost_events automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente: backend/fix_ai_cost_events.sql');
    } else {
      console.log('[Migrations] Tabela ai_cost_events verificada/criada.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar ai_cost_events:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: USER_MEMORY_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível criar agent_user_memory automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente o SQL de agent_user_memory (ver create_agent_sessions.ts).');
    } else {
      console.log('[Migrations] Tabela agent_user_memory verificada/criada.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar agent_user_memory:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: AGENT_TURN_LOGS_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível criar agent_turn_logs automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente o SQL de agent_turn_logs (ver create_agent_sessions.ts).');
    } else {
      console.log('[Migrations] Tabela agent_turn_logs verificada/criada.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar agent_turn_logs:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: DEDICATED_NUMBERS_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível criar dedicated_numbers/dedicated_number_sms automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente o SQL de dedicated_numbers (ver create_agent_sessions.ts).');
    } else {
      console.log('[Migrations] Tabelas dedicated_numbers/dedicated_number_sms verificadas/criadas.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar dedicated_numbers:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: CAMPAIGN_INSTANCES_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível criar campaign_instances automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente: backend/migrations/campaign_instances.sql');
    } else {
      console.log('[Migrations] Tabela campaign_instances verificada/criada.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar campaign_instances:', err.message);
  }

  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: PUSH_SUBSCRIPTIONS_SQL });
    if (rpcError) {
      console.warn('[Migrations] Não foi possível criar push_subscriptions/last_active_at automaticamente:', rpcError.message);
      console.warn('[Migrations] Execute manualmente o SQL de push_subscriptions (ver create_agent_sessions.ts).');
    } else {
      console.log('[Migrations] Tabela push_subscriptions e colunas last_active_at/last_reengagement_at verificadas/criadas.');
    }
  } catch (err: any) {
    console.warn('[Migrations] Erro ao verificar/criar push_subscriptions:', err.message);
  }
}
