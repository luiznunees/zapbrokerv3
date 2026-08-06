-- Data em que a instância conectou pela primeira vez de verdade — base pro cálculo de
-- rampa de aquecimento (ver campaignService.getWarmupInfo). Reconexões não resetam essa
-- data; só a primeira vez que o status vira 'connected' grava aqui.
alter table instances add column if not exists connected_at timestamptz;
