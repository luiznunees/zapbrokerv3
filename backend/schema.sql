-- Habilitar a extensão UUID se ainda não estiver habilitada
create extension if not exists "uuid-ossp";

-- Tabela de Usuários
create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password text not null,
  created_at timestamp with time zone default now()
);

-- Tabela de Instâncias (WhatsApp)
create table instances (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  status text default 'disconnected', -- disconnected, connecting, connected
  evolution_id text, -- ID retornado pela Evolution API
  created_at timestamp with time zone default now()
);

-- Tabela de Listas de Contatos
create table contact_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

-- Tabela de Contatos
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references contact_lists(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamp with time zone default now()
);

-- Tabela de Campanhas
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  instance_id uuid references instances(id) on delete set null,
  contact_list_id uuid references contact_lists(id) on delete set null,
  name text not null,
  message text not null,
  status text default 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Tabela de Mensagens da Campanha (Logs)
create table campaign_messages (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  evolution_message_id text,
  status text default 'PENDING', -- PENDING, SENT, DELIVERED, READ, FAILED
  error_message text,
  updated_at timestamp with time zone default now()
);

-- Índices para melhor performance
create index idx_instances_user_id on instances(user_id);
create index idx_contact_lists_user_id on contact_lists(user_id);
create index idx_contacts_list_id on contacts(list_id);
create index idx_campaigns_user_id on campaigns(user_id);
create index idx_campaign_messages_campaign_id on campaign_messages(campaign_id);
