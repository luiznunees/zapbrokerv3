# PRD - ZapBroker.dev

## 1. Visão Geral
O **ZapBroker** é uma plataforma SaaS (Software as a Service) de automação de WhatsApp focada exclusivamente no mercado imobiliário. O objetivo é permitir que corretores e imobiliárias automatizem o primeiro contato com leads, realizem remarketing e gerenciem seu funil de vendas sem o risco de banimento associado a disparos massivos desordenados.

**Domínio Oficial:** `zapbroker.dev`

---

## 2. Problema e Solução
### O Problema
Corretores de imóveis recebem leads de diversos portais (ZAP, VivaReal, Olx) e muitas vezes levam horas ou dias para fazer o primeiro contato via WhatsApp, o que resulta em baixas taxas de conversão. Além disso, o envio manual de centenas de mensagens é improducente e arriscado.

### A Solução
Uma ferramenta que:
1. Conecta o WhatsApp pessoal/business do corretor via QR Code.
2. Permite a importação de listas de contatos (CSV).
3. Automatiza disparos com variáveis personalizadas (ex: "Olá {nome}").
4. Mantém um ritmo humano de envio (intervalos aleatórios) para proteger o chip.
5. Organiza os contatos em um Kanban de Leads para gestão visual.

---

## 3. Público-Alvo
- Corretores Autônomos.
- Imobiliárias de Pequeno e Médio Porte.
- Gestores de Tráfego Imobiliário.

---

## 4. Planos e Precificação (Consolidado)
O faturamento é **Mensal**, mas as quotas de mensagens são resetadas **Semanalmente**.

| Plano | Preço | Mensagens/Semana | Conexões WhatsApp | Diferenciais |
| :--- | :--- | :--- | :--- | :--- |
| **Básico** | R$ 29,00 | 50 | 1 | IA Personalizável, Anti-Ban |
| **Plus** | R$ 69,00 | 125 | 2 | Analytics, Suporte Prioritário |
| **Pro** | R$ 119,00 | 250 | 5 | Acesso API, Suporte VIP |

---

## 5. Requisitos Funcionais
### 5.1 Onboarding e Autenticação
- Login via Google Auth (preferencial) ou Email/Senha.
- Fluxo de "Pick a Plan" para usuários novos.
- Checklist inicial para guiar o usuário na primeira conexão.

### 5.2 Conectividade (WhatsApp)
- Integração via Evolution API.
- Geração de QR Code em tempo real.
- Monitoramento de status (Conectado/Desconectado).

### 5.3 Gestão de Leads (CRM Lite)
- Importação de CSV com mapeamento de colunas.
- Visualização em Kanban (Novo, Atendimento, Visita, Proposta, Fechado).
- Exportação de leads em CSV.

### 5.4 Campanhas de Mensagens
- Criação de campanhas com agendamento.
- Personalização via variáveis `{nome}`.
- Sistema de quotas: Impede envios se a quota semanal for atingida.
- Logging de status de entrega (Enviado, Falhou).

### 5.5 Financeiro e Billing
- Integração com AbacatePay.
- Webhook seguro para ativação automática de assinaturas.
- Histórico de pagamentos no painel do usuário.

---

## 6. Stack Tecnológica
- **Frontend:** Next.js 14, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend:** Node.js (TypeScript), Express.
- **Banco de Dados:** Supabase (PostgreSQL).
- **Autenticação:** Supabase Auth.
- **Processamento de Fila:** Redis + BullMQ (para disparos em massa).
- **Emails:** Resend (onboarding@zapbroker.dev).
- **WhatsApp API:** Evolution API.

---

## 7. Requisitos Não-Funcionais
- **Segurança:** Validação de webhooks via headers secretos.
- **Escalabilidade:** Uso de rate limits por usuário seguindo o plano contratado.
- **SEO:** Landing Page otimizada com metatags dinâmicas e GeoIP para personalização de localidade.
- **UI/UX:** Design "Dark Premium" com micro-animações para uma sensação de software de alto nível.

---

## 8. Canais de Comunicação
- **Suporte:** suporte@zapbroker.dev
- **Financeiro:** financeiro@zapbroker.dev
- **Privacidade:** privacidade@zapbroker.dev
