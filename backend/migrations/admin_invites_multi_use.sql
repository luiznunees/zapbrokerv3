-- Convite compartilhável: 1 link, N vagas (ex: postar num fórum e liberar pros
-- primeiros 10 que se cadastrarem). Já roda sozinho no boot via runMigrations()
-- (ver backend/src/migrations/create_agent_sessions.ts) — esse arquivo é só a
-- referência manual caso o RPC exec_sql falhe.
alter table admin_invites add column if not exists max_uses integer not null default 1;
alter table admin_invites add column if not exists uses_count integer not null default 0;
update admin_invites set uses_count = 1 where is_used = true and uses_count = 0;

-- Revogar um link antes de esgotar as vagas (campanha encerrou, link vazou etc.),
-- sem perder o histórico de quantas vagas já foram usadas até ali.
alter table admin_invites add column if not exists revoked boolean not null default false;

create or replace function redeem_admin_invite(p_code text, p_user_id uuid)
returns admin_invites
language plpgsql
security definer
as $$
declare
  v_invite admin_invites;
begin
  update admin_invites
  set uses_count = uses_count + 1,
      used_by = coalesce(used_by, p_user_id),
      used_at = now(),
      is_used = (uses_count + 1 >= max_uses)
  where code = p_code
    and uses_count < max_uses
    and not revoked
  returning * into v_invite;

  return v_invite;
end;
$$;

-- Depois de rodar isso no Supabase, force o reload do cache de schema do PostgREST
-- se a função nova não for reconhecida de primeira:
-- notify pgrst, 'reload schema';
