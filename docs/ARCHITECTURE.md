# Arquitetura — ZapBroker Agente

## Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| Backend API | Express + TypeScript |
| Frontend | Next.js 16 + Tailwind CSS |
| Banco de Dados | Supabase (PostgreSQL) |
| LLM | Groq (Llama 3 70B, free tier) |
| WhatsApp | Evolution API (self-hosted) |
| Pagamentos | Stripe (cartão) + AbacatePay (PIX) |
| Fila | BullMQ + Redis |

## Arquitetura Geral

```
WhatsApp (Evolution API) ←──────────→ Evolution API Webhook
                                              ↓
  ┌─────────────────────────────────────────────────────┐
  │                   Backend (Express)                  │
  │                                                      │
  │  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │
  │  │ Agent Core │  │   REST API   │  │ Webhooks    │  │
  │  │ (LLM +     │  │ (campanhas,  │  │ (Stripe,    │  │
  │  │  Memória)  │  │  auth, etc)  │  │  Evolution)  │  │
  │  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘  │
  └────────┼─────────────────┼─────────────────┼────────┘
           │                 │                 │
           ▼                 ▼                 ▼
     ┌───────────────────────────────────────────────┐
     │              Supabase (PostgreSQL)              │
     │  tables: users, instances, contacts, campaigns │
     │  agent_memory, agent_suggestions, actions,     │
     │  conversation_log, subscriptions, payments      │
     └───────────────────────────────────────────────┘
           │
           ▼
     ┌──────────┐
     │ Groq API  │ ← Llama 3 70B (free tier)
     └──────────┘
           │
           ▼
     ┌──────────┐
     │  Redis    │ ← BullMQ (filas de campanhas)
     └──────────┘
```

## Fluxo do Agente (MVP)

```
1. Evento/disparo aciona Agent Core
   (ex: campanha finalizada, lead não respondeu, etc)

2. Agent Core busca contexto no Supabase
   - Dados do lead (histórico, status, últimas msgs)
   - Regras do corretor (tom, horário)
   - Campanhas ativas

3. Agent Core monta prompt e chama Groq
   Prompt: "Lead João perguntou preço há 3 dias e não respondeu.
            Corretor vende aptos em SP. Sugira follow-up."

4. Groq retorna sugestão
   { action: "suggest_followup", message: "Olá João...", reason: "..." }

5. Agent Core registra sugestão em agent_suggestions
   { lead_id, suggestion_text, status: "pending", created_at }

6. Corretor vê sugestão no painel web (chat)

7. Corretor aprova → agent_suggestions.status = "approved"
   → Agent Core envia mensagem via Evolution API

8. Se corretor recusar → status = "rejected" → nada acontece
```

## Novas Tabelas no Supabase

### agent_memory
```sql
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,           -- ex: 'last_contact', 'interest_level', 'asked_price'
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, key)
);
```

### agent_suggestions
```sql
CREATE TABLE agent_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id),
  suggestion_type TEXT NOT NULL,  -- 'follow_up', 'new_campaign', 'alert'
  title TEXT NOT NULL,
  message TEXT,                    -- mensagem sugerida
  reason TEXT,                     -- pq o agente sugeriu
  status TEXT DEFAULT 'pending',   -- 'pending', 'approved', 'edited', 'rejected'
  edited_message TEXT,             -- versão editada pelo corretor
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);
```

### agent_actions
```sql
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID REFERENCES agent_suggestions(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,     -- 'send_message', 'create_campaign', 'notify'
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

### conversation_log
```sql
CREATE TABLE conversation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,              -- 'user', 'agent', 'system'
  content TEXT NOT NULL,
  metadata JSONB,                  -- mensagens sugeridas, ações, etc
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Frontend — Novos Componentes

### Chat do Agente (página principal)
```
/app/agent/page.tsx         ← Página principal (chat)
/components/agent/
  ChatBox.tsx               ← Interface tipo ChatGPT
  ChatMessage.tsx           ← Mensagem individual
  SuggestionCard.tsx        ← Card de sugestão (Aprovar/Editar/Recusar)
  AudioRecorder.tsx         ← Gravação de áudio
  FileUpload.tsx            ← Upload de arquivos
  AgentSidebar.tsx          ← Histórico de conversas
```

### Dashboard (secundário — configurações)
```
/app/dashboard/
  settings/page.tsx         ← Configurações do agente (tom, horário)
  upgrade/page.tsx          ← Planos e upgrade
  checkout/page.tsx         ← Checkout (cartão/PIX)
```

## LLM — Groq (free tier)

- Modelo: `llama3-70b-8192`
- Free tier: 30 req/min, 14.400 req/dia
- Usado para:
  - Analisar conversas e sugerir follow-ups
  - Gerar mensagens personalizadas
  - Responder perguntas do corretor no chat
- Custo: R$ 0 (enquanto estiver no free tier)

## IA Prompt Engineering (exemplo)

```
System: Você é o ZapBroker, assistente de corretores de imóveis.
        Seu papel é analisar conversas com leads e sugerir ações.
        Você NUNCA envia mensagens sem aprovação do corretor.
        Seja direto e prático.

Context:
- Corretor: {nome}, especialista em {regiao}
- Lead: {nome}, perguntou sobre {imovel} em {data}
- Última mensagem do lead: "{texto}"
- Dias sem resposta: {dias}

Task: Analise se faz sentido enviar um follow-up.
      Se sim, sugira uma mensagem curta e personalizada.
      Se não, explique o motivo.
```

## Stripe — Produtos e Preços

Criados via script `backend/scripts/setup-stripe.js`

| Plano | Price ID | Valor |
|-------|----------|:-----:|
| Free (apenas Upgrade) | — | R$ 0 |
| Starter | `price_1TwhkwPii1WZp9QNG5Q0hXun` | R$ 39 |
| Pro | `price_1TwhkxPii1WZp9QNukRx3JYS` | R$ 79 |
