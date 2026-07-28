-- plan_id herdava IDs de produto do Stripe (prod_...) de uma migração antiga.
-- Troca para identificadores limpos, já que não há mais integração real com Stripe.
update subscriptions set plan_id = 'starter' where plan_id = 'prod_01j4WfgzmZjZWYspH4RCQFhj';
update subscriptions set plan_id = 'pro' where plan_id = 'prod_Uqr4bMTSyUYQuSwBdX4JTsmz';
update admin_invites set plan_id = 'starter' where plan_id = 'prod_01j4WfgzmZjZWYspH4RCQFhj';
update admin_invites set plan_id = 'pro' where plan_id = 'prod_Uqr4bMTSyUYQuSwBdX4JTsmz';
