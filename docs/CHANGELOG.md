# Changelog — ZapBroker

## [Próximo] — Agente MVP

### Mudanças na Precificação
- Novo modelo: **por campanha/mês** (não mais por instância)
- Planos: Free (1 campanha), Starter (5 campanhas/R$39), Pro (ilimitado/R$79)
- Stripe implementado: cartão de crédito com recorrência + trial 7 dias
- AbacatePay mantido como fallback (PIX)

### Nova Visão do Produto
- ZapBroker vira **agente de IA conversacional**
- Painel principal tipo ChatGPT
- Agente sugere follow-ups (não envia sem aprovação)
- Corretor envia áudio e anexos no painel
- Agente notifica corretor no WhatsApp
- Campanhas viram 1-click (sem configuração complexa)

### Backend — Novas Features
- `stripeService.ts` — checkout, portal, cancelamento
- `stripeWebhookController.ts` — webhook de assinaturas
- `paymentController.ts` — cartão (Stripe) + PIX (AbacatePay)
- Rotas: `/payments/subscription/cancel`, `/payments/portal`
- Cron: trial expiry check diário (00:30 BRT)
- Migration: `stripe_subscription_id`, `stripe_customer_id`, `trial_ends_at`

### Backend — Correções
- Redis config com `maxRetriesPerRequest: null` para BullMQ
- EmailService trata resend null sem crash
- `api.ts` recuperado de corrupção (disco cheio)
- Upload validado (tipo + tamanho máximo 10MB)
- Login com erro genérico (sem enumeração de usuários)
- CSP configurado no helmet

### Frontend — Mudanças
- Login usa `onClick` em vez de `onSubmit` (parou de gerar GET params)
- Checkout oferece escolha entre cartão (Stripe) e PIX (AbacatePay)
- Upgrade page linka pra `/dashboard/checkout` (embed)
- Login redirect vai pra checkout embedado
- `PaymentGuard` aceita status `free`
- `next.config.ts` com `allowedDevOrigins` e standalone só em produção
- Next.js atualizado 15.5.18 → 16.2.11

### Infraestrutura
- Stripe CLI instalado para webhook forwarding local
- Script `scripts/setup-stripe.js` cria produtos/preços automaticamente
- `.env` com Stripe, AbacatePay, Supabase, Redis, Evolution API
