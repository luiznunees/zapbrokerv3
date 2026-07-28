-- AbacatePay não tem mais PIX recorrente/automático (sem previsão de retorno).
-- Modelo passa a ser PIX manual mensal: um checkout avulso por ciclo, rastreado aqui
-- enquanto está pendente para não gerar duas cobranças no mesmo mês.
alter table subscriptions add column if not exists pending_checkout_id text;
alter table subscriptions add column if not exists pending_checkout_url text;
alter table subscriptions add column if not exists last_reminder_sent_at timestamptz;

-- Checkout transparente: QR code e código copia-e-cola renderizados no próprio site,
-- em vez de redirecionar para a página hospedada da AbacatePay.
alter table subscriptions add column if not exists pending_checkout_qrcode text;
alter table subscriptions add column if not exists pending_checkout_brcode text;
alter table subscriptions add column if not exists pending_checkout_expires_at timestamptz;
