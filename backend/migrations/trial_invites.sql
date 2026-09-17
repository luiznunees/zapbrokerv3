-- Convite de teste grátis: quando setado, o cadastro via esse convite cria uma assinatura
-- ativa com prazo (subscriptions.trial_ends_at), em vez do plano vitalício de 100 anos.
-- Ver authController.ts (register) e adminService.ts (generateInvite).
alter table admin_invites add column if not exists trial_days integer;
