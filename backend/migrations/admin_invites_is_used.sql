-- authController.ts e adminService.ts leem/gravam admin_invites.is_used, mas a coluna nunca
-- foi criada no schema — o fluxo de cadastro por convite está quebrado sem isso.
alter table admin_invites add column if not exists is_used boolean not null default false;
