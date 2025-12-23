-- 1. Garantir permissões no Schema Public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Garantir permissões em todas as tabelas existentes
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Configurar permissões padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- 4. (Opcional) Recriar as tabelas se não existirem (Copiado do schema.sql original)
create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password text not null,
  created_at timestamp with time zone default now()
);

create table if not exists instances (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  status text default 'disconnected',
  evolution_id text,
  created_at timestamp with time zone default now()
);

create table if not exists contact_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references contact_lists(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamp with time zone default now()
);

create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  instance_id uuid references instances(id) on delete set null,
  contact_list_id uuid references contact_lists(id) on delete set null,
  name text not null,
  message text not null,
  status text default 'PENDING',
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists campaign_messages (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  evolution_message_id text,
  status text default 'PENDING',
  error_message text,
  updated_at timestamp with time zone default now()
);
