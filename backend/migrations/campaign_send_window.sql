-- Janela de envio do disparo (ver backend/src/utils/sendWindow.ts).
-- Campanhas que já existem ganham 8h–20h, segunda a sábado, sem teto diário: nada mais sai
-- de madrugada nem no domingo (achado real: Fernanda, disparo começou 05h23 de um domingo e
-- o número foi banido). Campanhas novas gravam a janela escolhida no seletor.
alter table campaigns add column if not exists window_start_minute smallint not null default 480;
alter table campaigns add column if not exists window_end_minute smallint not null default 1200;
alter table campaigns add column if not exists window_weekdays smallint[] not null default '{1,2,3,4,5,6}';
alter table campaigns add column if not exists window_max_per_day integer;

-- Quando a mensagem saiu de fato. updated_at não serve pra isso: o webhook de
-- entregue/lido reescreve updated_at depois, e uma mensagem de ontem lida hoje contaria
-- como "enviada hoje" no teto diário.
alter table campaign_messages add column if not exists sent_at timestamptz;
create index if not exists campaign_messages_campaign_sent_at_idx on campaign_messages (campaign_id, sent_at);
