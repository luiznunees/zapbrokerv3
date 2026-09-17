-- Idade real do chip no WhatsApp, informada pelo usuário ao conectar — é essa idade que
-- determina risco de bloqueio, não a data em que o número foi conectado no ZapBroker
-- (um chip já maduro pode ser conectado hoje sem correr o mesmo risco de um número novo).
-- Ver campaignService.ts (getWarmupInfo) e instanceService.ts (createInstance).
alter table instances add column if not exists self_reported_chip_days integer;
