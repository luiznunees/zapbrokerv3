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

create policy if not exists "Users can view their own agent sessions" on agent_sessions
  for select using (auth.uid() = user_id);
create policy if not exists "Users can insert their own agent sessions" on agent_sessions
  for insert with check (auth.uid() = user_id);
create policy if not exists "Users can delete their own agent sessions" on agent_sessions
  for delete using (auth.uid() = user_id);
create policy if not exists "Users can update their own agent sessions" on agent_sessions
  for update using (auth.uid() = user_id);
create policy if not exists "Users can delete their own agent messages" on agent_messages
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

const USER_MEMORY_SQL = `
create table if not exists agent_user_memory (
  user_id uuid primary key references users(id) on delete cascade,
  facts jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table agent_user_memory enable row level security;

create policy if not exists "Users can view their own agent memory" on agent_user_memory
  for select using (auth.uid() = user_id);
create policy if not exists "Users can upsert their own agent memory" on agent_user_memory
  for insert with check (auth.uid() = user_id);
create policy if not exists "Users can update their own agent memory" on agent_user_memory
  for update using (auth.uid() = user_id);
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
}
