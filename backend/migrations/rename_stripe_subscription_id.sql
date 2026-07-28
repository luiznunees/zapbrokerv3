-- A coluna guardava o ID de assinatura da AbacatePay (não da Stripe) — nome herdado da migração do gateway antigo.
alter table subscriptions rename column stripe_subscription_id to gateway_subscription_id;
