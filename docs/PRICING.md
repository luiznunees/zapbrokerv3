# Precificação — ZapBroker

## Modelo de Cobrança

Cobrança por **disparo/mês**. Um disparo = 1 envio para uma lista de leads (qualquer tamanho).

Follow-ups sugeridos pelo agente **não** consomem disparo.

## Planos

| Plano | Disparos/mês | Leads na base | Conexões WhatsApp | Preço |
|-------|:------------:|:--------------:|:-----------------:|:-----:|
| Free   | 1 (vitalício) | 30             | 1                 | R$ 0   |
| Starter| 5            | 500            | 2                 | R$ 39  |
| Pro    | Ilimitado    | Ilimitado      | 5                 | R$ 79  |

## O que cada plano inclui

| Recurso | Free | Starter | Pro |
|---------|:----:|:-------:|:---:|
| Disparos | 1 único (não renova) | 5/mês | Ilimitado |
| Leads na base | 30 | 500 | Ilimitado |
| Conexões WhatsApp | 1 | 2 | 5 |
| Painel web (chat com agente) | ✅ | ✅ | ✅ |
| Agente sugere follow-ups | ✅ | ✅ | ✅ |
| Agente sugere upgrade | ✅ | ✅ | ✅ |
| Notificações no WhatsApp do corretor | ✅ | ✅ | ✅ |
| Envio de áudio no painel | ✅ | ✅ | ✅ |
| Anexar arquivos no painel | ✅ | ✅ | ✅ |
| Agente memoriza contexto de leads | ✅ | ✅ | ✅ |
| Detecção automática de colunas (CSV/XLSX) | ✅ | ✅ | ✅ |
| Agente responde automaticamente | — | — | Futuro |

## Free (sem trial, sem risco)

- **1 disparo vitalício** (não expira, não renova)
- **Até 30 leads** na base
- Tempo ilimitado pra testar
- Sem custo operacional (sem trial que queime API)

> O corretor usa 1 disparo grátis, vê o valor, e quando quiser fazer o 2º, precisa assinar.

## Gatilhos de Upgrade

1. **Ao criar 2º disparo** (se já usou o free):
   > "Você já usou seu disparo grátis. Assine o Starter (R$39) e faça até 5 disparos por mês."

2. **Ao bater 30 leads**:
   > "Você atingiu o limite de 30 leads no Free. Assine o Starter e adicione até 500 leads."

3. **Agente sugere** (quando detecta engajamento):
   > "João, você já testou o disparo e 5 leads responderam. Com R$39/mês você faz mais disparos."

## Cancelamento

- Botão em **Configurações → Assinatura → Cancelar**
- Pergunta motivo (opcional), confirma
- Mantém acesso até fim do período pago
- Depois vira Free automaticamente (1 disparo + 30 leads)

## Método de Pagamento

| Método | Recorrência | Trial | Provider |
|--------|:-----------:|:-----:|:--------:|
| Cartão de crédito | Automática | 7 dias | Stripe |
| PIX | Manual (todo mês) | — | AbacatePay |

## Ciclo de Vida

```
Cadastro → Free (1 disparo vitalício + 30 leads)
   ↓
Bateu limite → Gatilho de upgrade
   ↓
Assina Starter ou Pro → Cartão (trial 7 dias) ou PIX
   ↓
Todo mês → Cobrança automática (cartão) ou aviso (PIX)
   ↓
Cancelou → Acesso até fim do período → Vira Free
```
