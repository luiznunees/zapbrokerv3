# Ideias de ferramentas para o agente do corretor

Backlog de ferramentas (tools) para expandir o `agentService.ts` além do fluxo
atual de montagem de campanha. Curadoria: itens marcados com ✅ foram
escolhidos para entrar na fila de implementação; o resto é backlog aberto.

## Escolhidas (2026-07-25) — 🚀 implementadas em `agentService.ts`

- 🚀 **find_contact** — buscar um lead por nome/telefone e trazer os dados dele (status, lista, última interação).
- 🚀 **insert_message_variable** — já existia no worker de envio (`{nome}`, chave simples); só faltava o agente saber e oferecer proativamente — feito via prompt.
- 🚀 **suggest_message_rewrite** — o tool devolve diretrizes de copywriting; o próprio modelo escreve a versão melhorada na resposta.
- 🚀 **duplicate_campaign** — reaproveita mensagem/WhatsApp/mídia/timing de uma campanha anterior no rascunho atual (sem lista, sem enviar).
- 🚀 **cancel_scheduled_campaign** — via botão de confirmação (`suggest_cancel_scheduled_campaign`); cancela campanhas PENDING/PAUSED e devolve a cota consumida.
- 🚀 **list_connected_numbers** — lista todos os WhatsApps do usuário com status e contagem de conectados.
- 🚀 **disconnect_whatsapp** — via botão de confirmação (`suggest_disconnect_whatsapp`); desconecta (logout) um número específico.
- 🚀 **check_quota_status** — responde quantas campanhas restam no mês, ou se o plano é ilimitado.

## Novas ideias, nas mesmas áreas das escolhidas

**Contato / busca**
- `list_contacts_by_filter` — filtrar leads por lista, status ou "sem interação há X dias" e retornar os nomes, sem precisar abrir a tela de Leads.
- `get_contact_campaign_history` — mostrar em quais campanhas um contato específico já entrou e se respondeu.

**Mensagens**
- `generate_message_variations` — gerar automaticamente 2–3 variações de uma mensagem a partir de uma única ideia do corretor (hoje ele só reescreve o que já foi colado).
- `check_message_spam_risk` — avisar se o texto tem características que aumentam risco de bloqueio/spam no WhatsApp (links demais, tudo maiúsculo, muito curto e repetitivo entre variações).

**Campanhas**
- `reschedule_campaign` — trocar a data/hora de um disparo já agendado, sem precisar cancelar e recriar.
- `retry_failed_sends` — reenviar só para os contatos que falharam numa campanha, sem duplicar quem já recebeu.
- `edit_draft_before_send` — permitir "volta e troca a mensagem" no rascunho atual sem precisar recomeçar do zero (hoje `cancel_draft` descarta tudo).

**WhatsApp**
- `rename_whatsapp_instance` — renomear um número conectado (ex: "Vendas" vs "Suporte") pra facilitar quando tem mais de um.
- `check_whatsapp_health` — informar se um número está com sinal de risco de banimento (muitos disparos recentes, reconexões frequentes).

**Conta / plano**
- `check_plan_limits` — responder sobre limites do plano além de cota de campanhas (nº de leads, nº de WhatsApp conectados).
- `proactive_upgrade_nudge` — o agente percebe que o corretor está perto do limite de cota/leads e sugere upgrade antes de ele travar no meio de um disparo.

## Mais 20 ideias (2026-07-25, rodada 2)

**Contato / lista**
- 🚀 `merge_duplicate_contacts` — implementado como `find_duplicate_contacts` (detecta) + `suggest_merge_duplicate_contacts` (botão que mescla, mantendo o cadastro mais antigo de cada grupo).
- `clone_contact_list` — duplicar uma lista de contatos (útil pra testar segmentações diferentes sem mexer na original).
- `filter_contacts_for_campaign` — montar o rascunho já filtrado por um critério ("só quem não respondeu à campanha X", "só quem não recebeu nada esse mês").
- `suggest_list_segmentation` — sugerir como dividir a base (região, status, tempo sem contato) pra campanhas mais direcionadas.
- `summarize_lead_conversation` — resumir o histórico de conversa de um lead pra retomar contexto rápido antes de ligar/escrever.
- `flag_urgent_lead` — marcar um lead como prioritário/quente pra aparecer em destaque.

**Mensagens**
- `translate_message` — traduzir a mensagem pra outro idioma (leads estrangeiros).
- `adjust_message_tone` — ajustar tom sob pedido (mais formal, mais casual, mais direto).
- `compare_message_variants_performance` — qual variação de mensagem teve melhor taxa de resposta entre as usadas numa campanha.

**Campanhas**
- `schedule_recurring_campaign` — repetir uma campanha automaticamente (toda semana/mês) pra uma lista.
- `pause_all_campaigns` / `resume_all_campaigns` — pausar ou retomar todos os disparos ativos de uma vez (ex: situação de emergência/bloqueio).
- `suggest_best_send_time` — sugerir o melhor horário de envio baseado no histórico de resposta do corretor.
- 🚀 `estimate_campaign_quota_impact` — antes de confirmar, dizer exatamente quantas cotas/campanhas isso vai consumir e quantas sobram depois.
- `get_campaign_delivery_errors` — listar erros específicos de entrega de uma campanha (número inválido, não é WhatsApp, etc.), não só o total de falhas.
- `export_campaign_report` — gerar um resumo em texto de uma campanha (enviados, respondidos, falhas) pra copiar/compartilhar.

**WhatsApp / operacional**
- 🚀 `check_instance_rate_limit` — heurística baseada em volume enviado nas últimas 24h por número (baixo/moderado/alto risco).

**Conta / plano**
- `remind_plan_renewal` — avisar quando a assinatura está perto de renovar ou vencer.
- `generate_weekly_summary` — resumo semanal automático (leads novos, campanhas rodadas, taxa de resposta) sem o corretor precisar perguntar.

**Gestão de leads (complementa os itens que ficaram fora de escopo)**
- `batch_update_lead_status` — mudar o status de vários leads de uma vez com base num critério (ex: "marca como perdido quem não responde há 30 dias").

## Fora de escopo por ora (mencionadas antes, não escolhidas)

Gestão de status/nota/lembrete de lead (`update_lead_status`, `add_lead_note`,
`create_followup_reminder`, `list_stalled_leads`) e explicação de resultado de
campanha (`explain_campaign_result`) ficaram de fora da primeira leva —
revisitar depois se fizer sentido.
