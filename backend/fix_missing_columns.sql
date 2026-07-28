-- Adiciona as colunas que faltavam em agent_sessions e subscriptions.
-- Seguro rodar mesmo que alguma já exista (add column if not exists é idempotente).

alter table agent_sessions add column if not exists draft_campaign jsonb;

alter table subscriptions add column if not exists pix_cpf text;
alter table subscriptions add column if not exists pix_cellphone text;
