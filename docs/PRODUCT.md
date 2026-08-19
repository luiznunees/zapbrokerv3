# ZapBroker — Agente de Vendas para Corretores

## Visão Geral

ZapBroker é um **agente de IA** que ajuda corretores de imóveis a venderem mais no WhatsApp. O corretor conversa com o agente num painel tipo ChatGPT, e o agente sugere ações, monitora leads, e notifica o corretor.

## Problema

Corretores têm **preguiça** de criar campanhas — acham confuso, dá trabalho. Mas usam ChatGPT naturalmente. O produto precisa ser tão simples quanto conversar.

## Solução

Um **agente conversacional** que:
- O corretor fala o que quer em linguagem natural
- O agente monta o disparo (lista, mensagem, horário) e confirma antes de enviar
- Tudo via chat no navegador + notificações no WhatsApp

---

## Nomenclatura

| Termo | Significado |
|-------|-------------|
| Disparo | Envio de mensagem para uma lista de leads (antes: "campanha") |
| Leads | Contatos do corretor (antes: "clientes") |
| Painel | Interface web (antes: "dashboard") |
| Adicionar leads | Importar contatos (CSV/XLSX/digitado) |
| Assinar plano | Upgrade (antes: "upgrade de plano") |

---

## MVP (versão 1)

O agente **não envia nada sozinho**. Ele sugere, o corretor aprova.

### Funcionalidades

**1. Painel Web (Chat com o Agente)**
- Interface tipo ChatGPT
- Corretor digita perguntas e comandos
- Agente responde com texto e sugestões

**2. Adicionar Leads**
- **Upload CSV/XLSX** — sistema detecta automaticamente colunas (telefone, nome, email, etc)
- **Digitar um por um**
- **Copiar e colar**
- Valida números de telefone automaticamente

**3. Criar Disparo**
- Nome do disparo
- Selecionar lista de leads
- Escrever mensagem (ou pedir ajuda pro agente)
- **Imediato** ou **Agendado**
- Agente notifica no WhatsApp:
  > "✅ Disparo 'Vila Mariana' finalizado. 45/130 leads visualizaram."

**4. Notificações no WhatsApp do Corretor**
- Agente manda mensagem no WhatsApp do corretor:
  - *"✅ Disparo 'Vila Mariana' concluído — 150 mensagens enviadas"*
  - *"📩 João (11 99999-8888) respondeu: 'Qual o valor?'"*
- Corretor responde do próprio WhatsApp ou vai pro painel

**5. Agente Sugere Upgrade**
- Quando detecta que o corretor engajou:
  > *"João, você já usou seu disparo grátis e 5 leads responderam. Quer continuar? Com R$39/mês você faz mais disparos."*

**6. Memória de Contexto**
- Agente guarda histórico de cada lead
- Sabe se o lead já perguntou preço, visitou, pediu fotos
- Usa esse contexto pra montar a mensagem do próximo disparo

**7. Envio de Áudio**
- Corretor grava áudio diretamente no painel
- Áudio fica anexado à conversa do lead

**8. Anexar Arquivos**
- Corretor sobe PDFs, imagens, planilhas
- Agente associa ao lead correto

---

## Futuro (pós-MVP)

| Funcionalidade | Prioridade |
|----------------|:----------:|
| Agente responde leads automaticamente | Alta |
| Qualificação de leads com IA (quente/morno/frio) | Alta |
| Agendamento automático de visitas | Média |
| Integração com CRMs (Zapier, n8n, webhook) | Média |
| Importação automática de leads (OLX, Zap Imóveis) | Baixa |
| Múltiplos números por corretor | Baixa |
| Analytics e relatórios | Baixa |

---

## Fluxo Completo do Usuário

### 1. Onboarding

```
1. Acessa zapbroker.dev → Login (Google ou email)
2. Conecta WhatsApp (QR Code via Evolution API)
3. "Pronto! Agora vamos adicionar seus leads."
```

### 2. Adicionar Leads

```
4. "Adicione seus leads:"
   [Upload CSV/XLSX] → sistema reconhece colunas automaticamente
   [Digitar um por um]
   [Copiar e colar]
5. Agente confirma: "130 leads importados! Quer criar um disparo?"
```

### 3. Criar Disparo

```
6. Nome: "Apartamentos Vila Mariana"
7. Lista: [seleciona a lista]
8. Mensagem: digita ou pede pro agente ajudar
9. Agora: [Imediato] ou [Agendar para...]
10. [Criar Disparo]
```

### 4. Acompanhar

```
11. Agente notifica no WhatsApp do corretor:
    "✅ Disparo 'Vila Mariana' finalizado. 45/130 leads visualizaram."
```

### 5. Gerenciar (Painel Chat)

```
13. Corretor pergunta: "Quem respondeu?"
14. Agente mostra: "João (Quente), Maria (Fria), Carlos (Visitou)"
15. Corretor: "Envia foto do apto pra João"
16. Agente: "Claro! Pode anexar a foto aqui ou eu uso do último disparo?"
17. Corretor anexa → Agente envia via WhatsApp
```

### 6. Upgrade

```
18. Corretor tenta criar 2º disparo no Free
19. Modal: "Você já usou seu disparo grátis. Assine o Starter (R$39) e faça até 5 disparos por mês."
    [Ver Planos (R$39/mês)] [Ok, entendi]
```

### 7. Cancelamento

```
20. Painel → Configurações → Assinatura → Cancelar
21. "Tem certeza? Você vai perder disparos ilimitados. Seu acesso continua até [data]."
22. Confirma → Vira Free (1 disparo + 30 leads)
```

---

## Exemplos de Conversa com o Agente

### Chat no Painel

```
Corretor: "O que tenho hoje?"
Agente: "Disparo 'Casa Jardins' rodou há 2 dias.
         15 leads receberam. 5 responderam, 10 não.
         Quer disparar de novo pra quem não respondeu?"
Corretor: "Sim, manda pra eles"
Agente: "Beleza! Vou montar o disparo pra esses 10 leads. Qual mensagem quer mandar?"
```

### Notificação no WhatsApp

```
[ZapBroker] ✅ Disparo 'Cobertura Pinheiros' finalizado!
45 mensagens enviadas. 12 leads responderam.
➡️ Acesse o painel: zapbroker.dev/chat
```

### Agente Sugerindo Upgrade

```
Corretor: "Vou criar outro disparo"
Agente: "Você já usou seu disparo grátis desse mês.
         Com R$39/mês você faz até 5 disparos.
         Quer assinar o Starter?"
Corretor: "Quanto é?"
Agente: "R$39/mês. 7 dias grátis se for de cartão. Cancele quando quiser."
Corretor: "Vou assinar"
Agente: [Redireciona pro checkout]
```
