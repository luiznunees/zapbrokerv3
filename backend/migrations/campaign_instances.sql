-- Permite um disparo usar mais de um número de WhatsApp (round-robin ponderado por volume,
-- ver campaignProcessor.ts). campaigns.instance_id continua existindo pra compatibilidade
-- com disparos antigos de número único, mas deixa de ser a fonte de verdade quando há
-- múltiplos números associados aqui.
create table if not exists campaign_instances (
    campaign_id uuid not null references campaigns(id) on delete cascade,
    instance_id uuid not null references instances(id) on delete cascade,
    position int not null default 0,
    primary key (campaign_id, instance_id)
);

create index if not exists idx_campaign_instances_campaign on campaign_instances(campaign_id);
