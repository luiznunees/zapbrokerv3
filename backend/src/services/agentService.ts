import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../config/supabase';
import * as instanceService from './instanceService';
import * as contactService from './contactService';
import * as campaignService from './campaignService';
import { QuotaService } from './quotaService';
import { PLAN_LIMITS, DEFAULT_LIMITS } from '../config/limits';
import { logAiCost } from './costService';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fallback: quando o Groq falha (rate limit, instabilidade, etc.), o agente cai
// pro Gemini automaticamente em vez de devolver "tive um problema" pro usuário.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Action {
  type: 'suggest_followup' | 'suggest_upgrade' | 'import_leads' | 'connect_whatsapp' | 'confirm_campaign' | 'set_draft_list' | 'set_draft_media' | 'set_draft_timing'
    | 'cancel_scheduled_campaign' | 'disconnect_whatsapp' | 'merge_duplicate_contacts'
    | 'set_draft_schedule' | 'set_draft_instances' | 'set_draft_messages'
    | 'acknowledge_antiban_warning' | 'apply_duplicated_campaign' | 'cancel_duplicated_campaign' | 'acknowledge_quota_warning'
    | 'create_followup' | 'set_draft_exclusions';
  title: string;
  data?: any;
}

interface QuotaInfo {
  available: boolean;
  remaining: number;
  requested: number;
}

export interface CampaignDraft {
  name?: string;
  contactListId?: string;
  contactListName?: string;
  leadCount?: number;
  instanceId?: string;
  instanceName?: string;
  instanceStatus?: string;
  // Quando o corretor quer dividir o disparo entre vários números (ver AVISO PROATIVO DE
  // RISCO no prompt). Se preenchido, tem prioridade sobre instanceId/instanceName únicos.
  instanceIds?: string[];
  instanceNames?: string[];
  messageVariations?: string[];
  mediaUrl?: string | null;
  mediaType?: string;
  scheduledAt?: string | null;
  delaySeconds?: number;
  sequentialMode?: boolean;
  blockDelay?: number;
  batchSize?: number;
  batchDelaySeconds?: number;
  // Vira true só depois que o corretor confirma explicitamente o timing pelo componente
  // visual (request_timing_confirmation) — nunca setado por heurística automática.
  timingConfirmed?: boolean;
  excludedContactIds?: string[];
  // Avisos de risco calculados automaticamente (não pelo LLM) em recomputeDraftMeta — o
  // corretor precisa reconhecer explicitamente antes de readyToSend ficar true.
  needsAntiBanWarning?: boolean;
  antiBanAcknowledged?: boolean;
  needsQuotaWarning?: boolean;
  quotaAcknowledged?: boolean;
  readyToSend?: boolean;
  quota?: QuotaInfo;
}

export interface AgentComponent {
  type: 'list_picker' | 'file_upload' | 'timing_confirm' | 'schedule_picker' | 'instance_picker'
    | 'message_editor' | 'campaign_summary' | 'antiban_warning' | 'duplicate_campaign_confirm'
    | 'quota_confirm' | 'followup_scheduler' | 'lead_picker' | 'contact_exclusion';
  purpose?: string;
}

export interface AgentResponse {
  reply: string;
  actions: Action[];
  draftPatch?: (Partial<CampaignDraft> & { cancel?: boolean }) | null;
  component?: AgentComponent | null;
}

interface GroqToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface GroqChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: GroqToolCall[];
  };
  finish_reason: string;
}

interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChoice[];
}

// ─── Ferramentas disponíveis pro agente ──────────────────────
// Tools de leitura/rascunho são executadas direto (sem risco, reversíveis).
// Tools de ação sensível (connect_whatsapp, confirm_campaign, upgrade) só
// adicionam um botão de sugestão — a execução real continua exigindo clique
// do usuário no painel, via POST /agent/execute.

const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_contact_lists',
      description: 'Lista as listas de contatos do usuário com a contagem de leads de cada uma.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_whatsapp_instances',
      description: 'Lista os WhatsApps do usuário e se estão conectados ou não.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_campaign_stats',
      description: 'Retorna o resumo das campanhas/disparos recentes (enviados, lidos, respondidos) e quantos leads estão parados sem resposta há 3+ dias. Use pra responder perguntas sobre desempenho de campanhas — nunca invente números.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_campaign_draft',
      description: 'Atualiza o rascunho de disparo em andamento nesta conversa. Chame sempre que entender uma nova informação relevante (mensagem, WhatsApp a usar, agendamento, timing). Não inclua a lista de contatos aqui — ela é escolhida por um seletor visual (use request_contact_list_selection).',
      parameters: {
        type: 'object',
        properties: {
          instanceName: { type: 'string', description: 'Nome (ou parte) do WhatsApp que o usuário quer usar (disparo por um único número)' },
          instanceNames: { type: 'array', items: { type: 'string' }, description: 'Nomes (ou partes) de 2+ WhatsApps quando o corretor quer dividir o disparo entre vários números — use em vez de instanceName' },
          messageVariations: { type: 'array', items: { type: 'string' }, description: 'Uma ou mais variações da mensagem a enviar' },
          name: { type: 'string', description: 'Nome do disparo/campanha' },
          scheduledAt: { type: 'string', description: 'Data/hora ISO pra envio agendado; omita para envio imediato' },
          delaySeconds: { type: 'number', description: 'Segundos entre cada mensagem — só ajuste se o usuário pedir explicitamente' },
          sequentialMode: { type: 'boolean' },
          blockDelay: { type: 'number' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_contact_list_selection',
      description: 'Mostra um seletor visual de listas de contatos pro usuário escolher qual usar no disparo. Use quando faltar a lista no rascunho e o assunto de lista/contatos/leads vier à tona na conversa.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_media_upload',
      description: 'Mostra um botão de anexo pro usuário enviar imagem/vídeo/áudio pro disparo.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_timing_confirmation',
      description: 'Mostra um seletor visual pro usuário confirmar ou ajustar o tempo entre mensagens, o modo de envio (sequencial ou não) e o tamanho dos lotes. Use quando o rascunho já tiver lista e mensagem definidos e ainda faltar essa confirmação — NÃO pergunte esses valores em texto, sempre use essa ferramenta.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_schedule_confirmation',
      description: 'Mostra um seletor visual de data/hora pro usuário escolher entre enviar agora ou agendar o disparo. Use sempre que o usuário mencionar agendamento/data/hora — NÃO tente interpretar e converter a data você mesmo, sempre use essa ferramenta.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_instance_selection',
      description: 'Mostra um seletor visual dos WhatsApps conectados pro usuário escolher qual(is) usar no disparo (suporta escolher mais de um, pra dividir o envio entre vários números). Use em vez de tentar casar o nome do WhatsApp por texto.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_message_variations_editor',
      description: 'Mostra um editor visual das variações da mensagem do disparo (adicionar, remover, editar cada uma). Use quando o usuário já tiver uma mensagem capturada e quiser adicionar mais variações ou reorganizar — não precisa disso pra capturar a primeira mensagem, que continua vindo por texto via update_campaign_draft.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_contact_exclusion',
      description: 'Mostra um seletor visual dos leads da lista escolhida pro usuário marcar quais quer excluir desse disparo específico. Use quando o usuário disser que quer excluir alguém da lista antes de enviar.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_followup_scheduler',
      description: 'Mostra um seletor visual com os leads parados (sem resposta há alguns dias) pro usuário escolher quais querem receber um follow-up, com mensagem e horário de envio. Use quando o usuário quiser fazer follow-up de leads parados.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_draft',
      description: 'Cancela/descarta o rascunho de disparo em andamento nesta conversa.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_connect_whatsapp',
      description: 'Sugere (mostra um botão) pro usuário conectar um número de WhatsApp à plataforma — seja o primeiro ou mais um adicional. Use tanto quando não houver nenhum conectado quanto quando o usuário pedir explicitamente pra conectar mais um número (o botão gera o QR Code do próximo número disponível dentro do limite do plano dele).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_confirm_campaign',
      description: 'Sugere (mostra um botão) pro usuário confirmar e enviar o disparo, quando o rascunho já estiver completo (lista, WhatsApp e mensagem definidos) e o usuário indicar que quer enviar.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_upgrade',
      description: 'Sugere (mostra um botão) pro usuário fazer upgrade de plano, quando ele estiver sem saldo de mensagens ou pedir mais recursos.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_import_leads',
      description: 'Sugere (mostra um botão) pro usuário importar novos leads/contatos pra plataforma.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_campaign_performance',
      description: 'Compara o desempenho (taxa de resposta e de leitura) das campanhas do usuário: retorna a média geral, a melhor e a pior campanha, e opcionalmente uma campanha específica pra comparar com a média. Use isso pra responder perguntas do tipo "essa campanha foi boa?" ou "qual campanha teve mais resposta".',
      parameters: {
        type: 'object',
        properties: {
          campaignName: { type: 'string', description: 'Nome (ou parte do nome) de uma campanha específica pra comparar com a média geral. Omita pra só ver a visão geral.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remember_user_fact',
      description: 'Salva um fato sobre esse corretor pra lembrar em conversas futuras (preferências, padrões de trabalho, região de atuação, horários preferidos, etc). Use quando aprender algo genuinamente útil e duradouro sobre ele — não use pra detalhes de um disparo específico (isso é o rascunho, não memória de longo prazo).',
      parameters: {
        type: 'object',
        properties: {
          fact: { type: 'string', description: 'O fato em uma frase curta e objetiva, em português. Ex: "Prefere enviar disparos à noite, depois das 19h."' },
        },
        required: ['fact'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_contact',
      description: 'Busca um lead específico do usuário por nome ou telefone e retorna os dados dele (status, lista, última interação). Use quando o usuário perguntar sobre um contato específico pelo nome/telefone.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Nome (ou parte do nome) ou telefone do lead procurado' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_message_rewrite',
      description: 'Dá diretrizes de copywriting pra você reescrever/melhorar uma mensagem que o usuário colou ou pediu pra revisar. Depois de chamar essa ferramenta, escreva a versão melhorada na sua resposta em texto — a ferramenta não gera o texto final sozinha.',
      parameters: {
        type: 'object',
        properties: {
          originalMessage: { type: 'string', description: 'O texto original que o usuário quer melhorar' },
        },
        required: ['originalMessage'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'duplicate_campaign',
      description: 'Reaproveita uma campanha anterior (pelo nome) como ponto de partida do rascunho atual — copia mensagem, WhatsApp usado, mídia e timing, mas SEM lista de contatos (o usuário escolhe uma nova) e sem enviar nada ainda. Use quando o usuário disser algo como "repete a campanha X" ou "manda de novo aquele disparo do mês passado".',
      parameters: {
        type: 'object',
        properties: {
          campaignName: { type: 'string', description: 'Nome (ou parte do nome) da campanha anterior a reaproveitar' },
        },
        required: ['campaignName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_cancel_scheduled_campaign',
      description: 'Sugere (mostra um botão) pra cancelar um disparo agendado que ainda não começou a enviar. Use quando o usuário pedir pra cancelar/desmarcar uma campanha agendada pelo nome. Não funciona pra campanhas que já estão enviando ou já terminaram.',
      parameters: {
        type: 'object',
        properties: {
          campaignName: { type: 'string', description: 'Nome (ou parte do nome) da campanha agendada a cancelar' },
        },
        required: ['campaignName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_connected_numbers',
      description: 'Lista todos os números de WhatsApp do usuário com o status de cada um (conectado/desconectado) e um resumo de quantos estão ativos. Use pra responder perguntas sobre quantos/quais números estão conectados.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_disconnect_whatsapp',
      description: 'Sugere (mostra um botão) pra desconectar um número de WhatsApp específico. Use quando o usuário pedir explicitamente pra desconectar/remover um número (pelo nome).',
      parameters: {
        type: 'object',
        properties: {
          instanceName: { type: 'string', description: 'Nome (ou parte do nome) do número de WhatsApp a desconectar' },
        },
        required: ['instanceName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_quota_status',
      description: 'Retorna quantas campanhas o usuário ainda pode disparar este mês (ou se o plano dele é ilimitado). Use pra responder perguntas do tipo "quantos disparos eu ainda tenho" ou "minha cota tá acabando?".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estimate_campaign_quota_impact',
      description: 'Antes de confirmar um disparo, mostra exatamente quantas cotas de campanha isso vai consumir e quantas sobram depois. Use quando o usuário estiver perto de confirmar um disparo e quiser saber o impacto na cota, ou quando perguntar "isso vai gastar minha cota?".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_duplicate_contacts',
      description: 'Procura leads duplicados (mesmo telefone cadastrado mais de uma vez) na base do usuário. Use quando o usuário perguntar sobre contatos duplicados ou quando for relevante avisar proativamente que existem duplicados.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_merge_duplicate_contacts',
      description: 'Sugere (mostra um botão) pra mesclar automaticamente todos os contatos duplicados encontrados (mantém o cadastro mais antigo de cada grupo e remove os repetidos). Só chame depois de já ter usado find_duplicate_contacts e confirmado que existem duplicados.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_instance_rate_limit',
      description: 'Verifica o volume de mensagens enviadas por um número de WhatsApp nas últimas 24h e avisa se o ritmo está arriscado (risco de bloqueio pelo WhatsApp). Use quando o usuário perguntar se pode disparar mais, ou antes de confirmar um disparo grande no mesmo número que já enviou muito recentemente.',
      parameters: {
        type: 'object',
        properties: {
          instanceName: { type: 'string', description: 'Nome (ou parte do nome) do WhatsApp a verificar; se omitido, usa o número já definido no rascunho atual' },
        },
        required: [],
      },
    },
  },
] as const;

interface UserContext {
  userName: string;
  leadCount: number;
  campaignCount: number;
  currentPlan: string;
  planId: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Grátis',
  'starter': 'Starter',
  'pro': 'Pro',
};

function planLabel(planId: string): string {
  return PLAN_LABELS[planId] || PLAN_LABELS[planId?.toLowerCase()] || 'Grátis';
}

export async function buildContext(userId: string): Promise<UserContext> {
  // users.plan_id não existe — o plano vive na tabela subscriptions (a mais recente,
  // se houver mais de uma). A query antiga selecionava uma coluna inexistente, o que
  // fazia a query inteira falhar e todo mundo cair no fallback "Corretor"/"Grátis".
  const [{ data: user }, { data: subscription }] = await Promise.all([
    supabase.from('users').select('name').eq('id', userId).single(),
    supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const userName = user?.name || 'Corretor';
  const planId = subscription?.status === 'active' ? subscription.plan_id : 'free';
  const currentPlan = planLabel(planId);

  const { count: rawCampaignCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  const campaignCount = rawCampaignCount ?? 0;

  const { data: userLists } = await supabase
    .from('contact_lists')
    .select('id')
    .eq('user_id', userId);

  const listIds = userLists?.map(l => l.id) || [];
  let leadCount = 0;

  if (listIds.length > 0) {
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .in('list_id', listIds);
    leadCount = count ?? 0;
  }

  return { userName, leadCount, campaignCount, currentPlan, planId };
}

interface BrokerContext {
  city: string | null;
  chipCount: number | null;
  chipPurposes: string[];
  wantsListingReferrals: boolean | null;
}

const EMPTY_BROKER_CONTEXT: BrokerContext = { city: null, chipCount: null, chipPurposes: [], wantsListingReferrals: null };

// Contexto coletado no onboarding (cidade, quantos WhatsApps o corretor usa, pra que usa
// cada um, se quer indicação de listagens) — vive dentro de users.onboarding_steps (jsonb),
// sem tabela própria. Usado só pra personalizar o prompt, nunca pra decidir ações sozinho.
export async function buildBrokerContext(userId: string): Promise<BrokerContext> {
  const { data: user } = await supabase
    .from('users')
    .select('onboarding_steps')
    .eq('id', userId)
    .single();

  const raw = user?.onboarding_steps?.broker_context;
  if (!raw) return EMPTY_BROKER_CONTEXT;

  return {
    city: raw.city ?? null,
    chipCount: typeof raw.chipCount === 'number' ? raw.chipCount : null,
    chipPurposes: Array.isArray(raw.chipPurposes) ? raw.chipPurposes : [],
    wantsListingReferrals: typeof raw.wantsListingReferrals === 'boolean' ? raw.wantsListingReferrals : null,
  };
}

// ─── Skill de disparo — defaults inteligentes ───────────────

function messageReferencesContacts(text: string): boolean {
  return /\b(lista|listas|contato|contatos|lead|leads)\b/i.test(text);
}

function extractQuotedMessage(text: string): string | null {
  const matches = [...text.matchAll(/["“]([^"”]{8,})["”]/g)].map(m => m[1].trim());
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.length - a.length)[0];
}

function computeSmartDefaults(messageVariations: string[] | undefined, leadCount: number | undefined) {
  const text = messageVariations?.[0] || '';
  const hasMultipleParagraphs = (text.match(/\n\s*\n/g)?.length ?? 0) >= 1;
  const sequentialMode = text.length > 200 || hasMultipleParagraphs;

  let delaySeconds = 5;
  if ((leadCount ?? 0) > 200) delaySeconds = 8;
  else if ((leadCount ?? 0) > 50) delaySeconds = 6;

  return { sequentialMode, blockDelay: 5, delaySeconds };
}

function resolveDraftReferences(
  current: CampaignDraft,
  patch: NonNullable<AgentResponse['draftPatch']>,
  lists: Array<{ id: string; name: string; leadCount: number }>,
  instances: Array<{ id: string; name: string; status: string }>
): CampaignDraft {
  const draft: CampaignDraft = { ...current };
  const patchTouchedTiming = patch.delaySeconds !== undefined || patch.sequentialMode !== undefined || patch.blockDelay !== undefined;

  // A lista de contatos é definida via componente visual (set_draft_list), não por texto —
  // ver executeAction(). Aqui só resolvemos a instância de WhatsApp por nome.
  if (typeof (patch as any).instanceName === 'string') {
    const query = (patch as any).instanceName.toLowerCase();
    const match = instances.find(i => i.name.toLowerCase().includes(query) || query.includes(i.name.toLowerCase()));
    if (match) {
      draft.instanceId = match.id;
      draft.instanceName = match.name;
      draft.instanceStatus = match.status;
      draft.instanceIds = undefined;
      draft.instanceNames = undefined;
    }
  }

  // Disparo dividido entre vários números — resolve cada nome pra um WhatsApp existente.
  if (Array.isArray((patch as any).instanceNames) && (patch as any).instanceNames.length > 0) {
    const matches: Array<{ id: string; name: string; status: string }> = ((patch as any).instanceNames as string[])
      .map((name: string) => {
        const query = name.toLowerCase();
        return instances.find(i => i.name.toLowerCase().includes(query) || query.includes(i.name.toLowerCase()));
      })
      .filter((m): m is { id: string; name: string; status: string } => Boolean(m));

    if (matches.length > 0) {
      draft.instanceIds = matches.map((m) => m.id);
      draft.instanceNames = matches.map((m) => m.name);
      // Mantém os campos singulares como "principal" pra código que ainda só olha um número
      // (ex: check_instance_rate_limit) sem quebrar o fluxo existente.
      draft.instanceId = matches[0].id;
      draft.instanceName = matches[0].name;
      draft.instanceStatus = matches[0].status;
    }
  }

  if (Array.isArray(patch.messageVariations) && patch.messageVariations.length > 0) {
    draft.messageVariations = patch.messageVariations.filter((m: any) => typeof m === 'string' && m.trim().length > 0);
  }
  if (patch.mediaUrl !== undefined) {
    draft.mediaUrl = patch.mediaUrl;
    if (patch.mediaType) draft.mediaType = patch.mediaType;
  }
  if (patch.scheduledAt !== undefined) draft.scheduledAt = patch.scheduledAt;
  if (patch.name) draft.name = patch.name;
  if (patch.delaySeconds !== undefined) draft.delaySeconds = patch.delaySeconds;
  if (patch.sequentialMode !== undefined) draft.sequentialMode = patch.sequentialMode;
  if (patch.blockDelay !== undefined) draft.blockDelay = patch.blockDelay;

  // Recalcula os defaults automáticos sempre que a mensagem ou a lista mudarem,
  // a não ser que o usuário tenha explicitamente pedido pra ajustar esse turno.
  if (!patchTouchedTiming && (draft.messageVariations?.length || draft.leadCount !== undefined)) {
    const defaults = computeSmartDefaults(draft.messageVariations, draft.leadCount);
    draft.sequentialMode = defaults.sequentialMode;
    draft.blockDelay = defaults.blockDelay;
    draft.delaySeconds = defaults.delaySeconds;
  }

  return draft;
}

// Avisos de risco são sempre automáticos (calculados em recomputeDraftMeta), nunca dependem
// do LLM lembrar de mencionar — isso decide se um deles precisa aparecer agora no chat.
function deriveRiskComponent(draft: CampaignDraft | null): AgentComponent | null {
  if (!draft) return null;
  if (draft.needsAntiBanWarning && !draft.antiBanAcknowledged) {
    return { type: 'antiban_warning', purpose: JSON.stringify({ leadCount: draft.leadCount }) };
  }
  if (draft.needsQuotaWarning && !draft.quotaAcknowledged) {
    return { type: 'quota_confirm', purpose: JSON.stringify(draft.quota) };
  }
  return null;
}

function buildDraftChecklist(draft: CampaignDraft | null): string {
  if (!draft) return 'Nenhum disparo em andamento nesta conversa.';

  const done: string[] = [];
  const missing: string[] = [];

  if (draft.contactListId) done.push(`lista de contatos (${draft.contactListName}, ${draft.leadCount} leads)`);
  else missing.push('lista de contatos');

  if (draft.instanceIds && draft.instanceIds.length > 1) done.push(`WhatsApp (dividido entre ${draft.instanceNames?.join(' + ')})`);
  else if (draft.instanceId) done.push(`WhatsApp (${draft.instanceName})`);
  else missing.push('WhatsApp');

  if (draft.messageVariations?.length) done.push(`mensagem ("${draft.messageVariations[0].substring(0, 60)}")`);
  else missing.push('mensagem');

  const lines = [
    done.length > 0 ? `JÁ DEFINIDO (NÃO pergunte de novo sobre isso): ${done.join('; ')}.` : 'Nada definido ainda.',
    missing.length > 0 ? `AINDA FALTA perguntar: ${missing.join('; ')}.` : 'Está tudo pronto — só falta o usuário confirmar o envio no painel.',
  ];

  if (draft.timingConfirmed) {
    lines.push(`JÁ DEFINIDO (NÃO pergunte de novo): timing confirmado pelo usuário — ${draft.delaySeconds}s entre mensagens${draft.sequentialMode ? ', modo sequencial (quebra em blocos)' : ''}, lotes de ${draft.batchSize ?? 30} leads a cada ${draft.batchDelaySeconds ?? 60}s.`);
  } else if (draft.contactListId && draft.messageVariations?.length) {
    lines.push('AINDA FALTA: confirmar o tempo entre mensagens e o tamanho dos lotes — chame request_timing_confirmation (não pergunte isso em texto, é sempre por seletor visual).');
  }
  lines.push(draft.mediaUrl ? 'Já tem mídia anexada ao disparo.' : 'Ainda sem mídia anexada — pergunte se o usuário quer anexar imagem/vídeo/áudio.');

  return lines.join('\n');
}

// Acima disso, disparar pra uma lista grande usando um único número aumenta bastante o
// risco de bloqueio do WhatsApp — vale um aviso explícito, não só uma sugestão em texto.
const ANTIBAN_LEAD_THRESHOLD = 300;

async function recomputeDraftMeta(userId: string, planId: string, draft: CampaignDraft): Promise<CampaignDraft> {
  if (draft.contactListId && draft.leadCount !== undefined) {
    const quota = await QuotaService.checkAvailability(userId, planId, 1);
    draft.quota = { available: quota.available, remaining: quota.remaining, requested: quota.requested };
  } else {
    draft.quota = undefined;
  }

  // Avisos de risco calculados aqui (não pelo LLM) — garantem que o corretor sempre vê o
  // aviso antes de poder disparar, independente do modelo "lembrar" de mencionar.
  const usingSingleInstance = !draft.instanceIds || draft.instanceIds.length <= 1;
  draft.needsAntiBanWarning = Boolean(
    draft.contactListId && (draft.leadCount ?? 0) > ANTIBAN_LEAD_THRESHOLD && usingSingleInstance
  );
  if (!draft.needsAntiBanWarning) draft.antiBanAcknowledged = false;

  draft.needsQuotaWarning = Boolean(draft.quota && draft.quota.available && draft.quota.remaining === 1);
  if (!draft.needsQuotaWarning) draft.quotaAcknowledged = false;

  draft.readyToSend = Boolean(
    draft.contactListId &&
    draft.instanceId &&
    draft.messageVariations?.length &&
    draft.timingConfirmed &&
    (!draft.quota || draft.quota.available) &&
    (!draft.needsAntiBanWarning || draft.antiBanAcknowledged) &&
    (!draft.needsQuotaWarning || draft.quotaAcknowledged)
  );

  return draft;
}

function buildSystemPrompt(
  ctx: UserContext,
  draft: CampaignDraft | null,
  memoryFacts: string[] = [],
  brokerContext: BrokerContext = EMPTY_BROKER_CONTEXT,
): string {
  const draftText = `Estado do disparo em andamento:\n${buildDraftChecklist(draft)}`;

  const memoryText = memoryFacts.length > 0
    ? `O QUE VOCÊ JÁ SABE SOBRE ESSE CORRETOR (de conversas anteriores — use pra personalizar, não repita como se fosse novidade):\n${memoryFacts.map(f => `- ${f}`).join('\n')}`
    : '';

  const hasBrokerContext = brokerContext.city || brokerContext.chipCount || brokerContext.chipPurposes.length > 0;
  const brokerContextText = hasBrokerContext
    ? `CONTEXTO DO CORRETOR (coletado no onboarding — use pra personalizar e pra avisos proativos, não repita de volta como se fosse pergunta):
- Cidade/região: ${brokerContext.city || 'não informado'}
- Números de WhatsApp que ele usa hoje: ${brokerContext.chipCount ?? 'não informado'}
- Uso de cada número: ${brokerContext.chipPurposes.length > 0 ? brokerContext.chipPurposes.join(', ') : 'não informado'}
- Quer indicação de listagens de condomínio: ${brokerContext.wantsListingReferrals === null ? 'não informado' : brokerContext.wantsListingReferrals ? 'sim' : 'não'}`
    : '';

  return `Você é o assistente virtual da ZapBroker — o braço-direito do corretor de imóveis dentro da plataforma. Seu papel é bem mais amplo que "fazer disparo": você é o suporte e o parceiro de conversa dele no dia a dia — tira dúvida sobre vendas, dá conselho, bate papo, ajuda a pensar em estratégia com um lead específico, e também monta e envia campanhas de WhatsApp quando ele precisar. Disparo é UMA das coisas que você faz, não a única — trate perguntas soltas e conversa casual como interações legítimas, não como desvio do "verdadeiro" propósito.

TOM DE VOZ:
- Informal mas profissional, como um consultor de vendas experiente
- Direto e objetivo, sem rodeios
- Use linguagem simples, sem jargão técnico
- Chame o usuário de "você"
- Seja amigável mas vá direto ao ponto
- Responda sempre em português brasileiro

CONTEXTO DO USUÁRIO:
- Nome: ${ctx.userName}
- Total de leads: ${ctx.leadCount}
- Total de campanhas: ${ctx.campaignCount}
- Plano atual: ${ctx.currentPlan}

${draftText}

${memoryText}

${brokerContextText}

VOCÊ TEM FERRAMENTAS (tools) — use-as em vez de tentar adivinhar ou responder de memória:
- get_contact_lists / get_whatsapp_instances / get_campaign_stats: chame ANTES de responder qualquer pergunta sobre listas, WhatsApps conectados ou desempenho de campanhas. Nunca invente números ou nomes.
- update_campaign_draft: chame toda vez que entender uma informação nova relevante pro disparo (mensagem, WhatsApp, agendamento). NÃO inclua lista de contatos aqui. Use "instanceName" pra um único número, ou "instanceNames" (lista) quando o corretor quiser dividir o disparo entre 2+ números conectados — o envio real faz o balanceamento automático entre eles, você só precisa registrar quais números usar.
- request_contact_list_selection: chame quando faltar a lista no rascunho e o assunto de lista/contatos/leads vier à tona — isso mostra um seletor visual pro usuário. Não peça pro usuário digitar o nome da lista.
- request_media_upload: chame se quiser oferecer anexar imagem/vídeo/áudio ao disparo.
- request_timing_confirmation: chame quando lista e mensagem já estiverem definidas e faltar confirmar o tempo entre mensagens/tamanho dos lotes — isso mostra um seletor visual com valores recomendados, mas quem decide é o usuário. NUNCA pergunte esses números em texto nem assuma que ele aceitou o valor recomendado sem passar por esse seletor.
- request_schedule_confirmation: chame sempre que o usuário mencionar agendar/data/hora pro disparo — NÃO tente converter "amanhã de manhã" pra ISO você mesmo, sempre mostre o seletor.
- request_instance_selection: chame pra escolher o(s) WhatsApp(s) do disparo em vez de tentar casar o nome por texto — mesmo se o usuário só tiver 1 WhatsApp conectado, use essa ferramenta pra confirmar (não assuma).
- request_message_variations_editor: use se o usuário quiser adicionar mais variações da mensagem ou reorganizar as que já existem (a primeira mensagem continua sendo capturada por texto normalmente).
- request_contact_exclusion: use se o usuário disser que quer excluir algum lead específico da lista antes desse disparo.
- cancel_draft: chame se o usuário quiser cancelar o disparo em andamento.
- suggest_connect_whatsapp / suggest_confirm_campaign / suggest_upgrade / suggest_import_leads: mostram um botão de ação pro usuário. Você nunca executa essas ações sozinho — só sugere o botão; a execução real depende do clique do usuário.
- compare_campaign_performance: use pra responder qualquer pergunta comparativa sobre desempenho de campanhas ("essa foi boa?", "qual campanha performou melhor?").
- remember_user_fact: use quando aprender algo duradouro e útil sobre esse corretor (preferências, rotina, região) que vale lembrar em conversas futuras — não use pra dados de um disparo específico.
- find_contact: use quando o usuário perguntar sobre um lead específico pelo nome/telefone — nunca invente dados de contato.
- suggest_message_rewrite + sua própria escrita: quando o usuário pedir pra melhorar/reescrever uma mensagem, chame suggest_message_rewrite pra pegar as diretrizes e escreva a versão melhorada na resposta.
- duplicate_campaign: quando o usuário quiser repetir um disparo antigo ("manda de novo aquela campanha X"), isso já preenche o rascunho com mensagem/WhatsApp/mídia da campanha anterior — só falta pedir a lista de contatos nova.
- suggest_cancel_scheduled_campaign: quando o usuário pedir pra cancelar um disparo agendado pelo nome.
- list_connected_numbers: use pra responder quantos/quais WhatsApps estão conectados.
- suggest_disconnect_whatsapp: quando o usuário pedir explicitamente pra desconectar um número.
- check_quota_status / estimate_campaign_quota_impact: use pra responder sobre cota disponível, e chame estimate_campaign_quota_impact antes de sugerir confirmar um disparo se o usuário parecer preocupado com o limite do plano.
- find_duplicate_contacts / suggest_merge_duplicate_contacts: se o usuário perguntar sobre duplicados, chame find_duplicate_contacts primeiro; só ofereça o botão de mesclar (suggest_merge_duplicate_contacts) se realmente houver duplicados.
- check_instance_rate_limit: use antes de confirmar um disparo grande, ou se o usuário perguntar se está seguro mandar mais mensagens por aquele número.

AVISO PROATIVO DE RISCO (chip único): se o CONTEXTO DO CORRETOR indicar que ele só usa 1 número de WhatsApp e o disparo em andamento for de volume alto (ou check_instance_rate_limit retornar risco "moderado" ou "alto"), avise proativamente ANTES de confirmar o disparo — sem que ele precise perguntar — que dividir o envio entre 2 números reduz bastante o risco de bloqueio, e chame suggest_connect_whatsapp oferecendo conectar um segundo número. Se ele já tiver 2+ números conectados e a lista for grande, pergunte se quer dividir o disparo entre os números conectados em vez de mandar tudo por um só.

PRIORIDADE DA CONVERSA: se o usuário fizer uma pergunta ou comentário que não seja sobre o rascunho de disparo em andamento (dúvida de vendas, pergunta sobre um lead, bate-papo, qualquer coisa fora do fluxo), RESPONDA ISSO PRIMEIRO, de forma direta e completa — mesmo que exista um disparo em andamento. Só depois de responder, se fizer sentido, retome o disparo com uma frase curta tipo "quer continuar de onde paramos no disparo?". Nunca ignore a pergunta do usuário pra insistir no que falta no rascunho — isso é o erro mais irritante que você pode cometer.

SKILL DE DISPARO (o produto NÃO tem tela de criar campanha — é você quem monta tudo por conversa):
- Você não acessa links (URLs) que o usuário colar na conversa — se ele mandar um link de um imóvel, peça pra ele descrever as informações direto no chat (características, diferencial, preço) em vez de tentar abrir o link.
- Quando o usuário disser que quer fazer um disparo/campanha/enviar mensagem em massa, comece a montar o rascunho aos poucos, perguntando o que faltar.
- Siga o "Estado do disparo em andamento" acima à risca. NUNCA pergunte de novo sobre um campo já listado como "JÁ DEFINIDO". Só pergunte sobre o que está em "AINDA FALTA".
- REGRA DE OURO (vale só enquanto você estiver ativamente montando o disparo, não pra toda e qualquer resposta): nunca termine uma resposta sobre o disparo sem dar um próximo passo claro — ou uma pergunta específica (não genérica) sobre o que falta, ou um aviso de que está tudo pronto pra confirmar. Isso não significa forçar o assunto do disparo quando o usuário estava falando de outra coisa (veja PRIORIDADE DA CONVERSA acima).
- Depois que lista, WhatsApp e mensagem já estiverem definidos, ainda faltam DUAS coisas antes de considerar o disparo pronto: (1) se ele quer anexar imagem/vídeo/áudio (pergunte em texto, use request_media_upload se ele topar), e (2) confirmar o timing — chame request_timing_confirmation (não é uma pergunta de texto, é sempre o seletor visual). Só ofereça pra confirmar o disparo depois dessas duas coisas — não pressuponha que ele não quer nenhuma das duas.
- O tempo/modo de envio/tamanho de lote têm valores recomendados calculados automaticamente, mas NUNCA são aplicados sozinhos — a confirmação é sempre via request_timing_confirmation (seletor visual com inputs editáveis), nunca perguntando em texto e aceitando a resposta em texto livre.
- Se "AINDA FALTA" incluir "mensagem" e o usuário escrever qualquer texto que pareça ser o conteúdo a enviar (entre aspas, depois de "essa mensagem", "manda isso", "pode ser assim", ou uma frase que faça sentido pra um lead) — SEMPRE capture esse texto via update_campaign_draft, mesmo que o tom seja informal ou pareça um desabafo. Você não decide se a mensagem é "boa o suficiente" — só captura, e se quiser, sugere uma versão melhorada como opção.
- Se a mensagem do usuário contiver um trecho "[Anexo disponível: nome (tipo) em URL]", é um arquivo que ele já anexou pela interface — confirme no reply que ficou vinculado (a vinculação em si acontece fora do seu controle, pelo componente de upload).
- Personalização: o placeholder {nome} dentro de uma mensagem é substituído automaticamente pelo nome de cada lead no envio. Ofereça isso proativamente quando ajudar a escrever/melhorar uma mensagem (ex: "Oi {nome}, tudo bem?") — não é necessário perguntar, só avise que vai personalizar.
- Se faltar WhatsApp conectado, avise e chame suggest_connect_whatsapp antes de seguir com o disparo.
- Se o usuário disser que "já tem" WhatsApp conectado (sem citar qual), chame get_whatsapp_instances antes de perguntar mais nada. Se só existir um conectado, já use esse via update_campaign_draft e confirme pelo nome — NÃO pergunte "qual número" como se houvesse várias opções quando só tem uma.
- Se o usuário pedir pra conectar "mais um" WhatsApp mesmo já tendo um conectado, NÃO diga que já está conectado e recuse — chame suggest_connect_whatsapp normalmente; o botão vai gerar o QR Code de um número novo (respeitando o limite do plano dele).
- Nunca contradiga o "JÁ DEFINIDO" na sua resposta em texto.
- Mensagens que começam com "[EVENTO DO SISTEMA — não é fala do usuário]" não foram digitadas pelo usuário — são notificações automáticas de uma ação que ele fez pela interface (escolheu uma lista, anexou mídia). Reaja normalmente continuando a conversa a partir disso, seguindo a REGRA DE OURO acima — nunca pare depois de um evento desses sem fazer a próxima pergunta ou confirmar que está tudo pronto.

CONHECIMENTO DE VENDAS IMOBILIÁRIA (use isso pra dar conselhos reais, não só operar o sistema):
- Cadência de follow-up: não seja insistente (não manda todo dia), mas também não deixa o lead esfriar — 2 a 4 dias sem resposta já é um bom momento pra um follow-up leve, não um "e aí, viu minha mensagem?".
- Objeção de preço ("tá caro"): não desconte de cara. Explore o que "caro" significa pro lead — comparado a quê? Reforce valor (localização, condição, potencial), pergunte sobre forma de pagamento/condições antes de mexer no preço.
- "Vou pensar" / sumiço depois da primeira mensagem: normalmente significa falta de urgência genuína ou dúvida não resolvida, não desinteresse total. Pergunta aberta funciona melhor que cobrança: "Ficou alguma dúvida sobre o imóvel que eu possa esclarecer?".
- Qualificação: descobrir orçamento, prazo pra decidir e região de interesse cedo evita gastar esforço com quem não vai fechar. Perguntas abertas e casuais funcionam melhor que interrogatório.
- Tom: consultivo e humano, nunca robótico ou com cara de mensagem em massa — mesmo sabendo que é um disparo, a mensagem individual deve soar pessoal.
- Urgência sem pressão: gatilhos reais (visitas marcadas, outro interessado) funcionam; pressão falsa/genérica soa forçado e queima a credibilidade do corretor.
- Você pode dar esse tipo de conselho a qualquer momento que o corretor perguntar, mesmo fora do fluxo de montar um disparo.

Responda sempre em texto puro, natural, sem JSON e sem markdown de código. Use as ferramentas para agir; o texto é só a sua fala pro corretor.`;
}

// ─── In-memory fallback ─────────────────────────────────────

const memoryStore: {
  sessions: Map<string, { id: string; user_id: string; title: string; created_at: Date; updated_at: Date; draft_campaign?: CampaignDraft | null }>;
  messages: Map<string, { id: string; user_id: string; session_id: string; role: string; content: string; metadata?: any; created_at: Date }[]>;
  userFacts: Map<string, string[]>;
} = {
  sessions: new Map(),
  messages: new Map(),
  userFacts: new Map(),
};

let tableMissing = false;

function isTableMissingError(error: any): boolean {
  return error?.message?.includes('Could not find the table') ?? false;
}

// ─── Session CRUD ───────────────────────────────────────────

export async function createSession(userId: string, title?: string) {
  const { data, error } = await supabase
    .from('agent_sessions')
    .insert({ user_id: userId, title: title || 'Nova conversa' })
    .select('id, title, created_at, updated_at')
    .single();

  if (error) {
    if (isTableMissingError(error)) {
      tableMissing = true;
      const session = { id: crypto.randomUUID(), user_id: userId, title: title || 'Nova conversa', created_at: new Date(), updated_at: new Date(), draft_campaign: null };
      memoryStore.sessions.set(session.id, session);
      return session;
    }
    console.error('[AgentService] Error creating session:', error.message);
    throw new Error('Erro ao criar sessão');
  }
  return data;
}

export async function listSessions(userId: string) {
  const { data, error } = await supabase
    .from('agent_sessions')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    if (isTableMissingError(error)) {
      tableMissing = true;
      return Array.from(memoryStore.sessions.values())
        .filter(s => s.user_id === userId)
        .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
    }
    console.error('[AgentService] Error listing sessions:', error.message);
    return [];
  }
  return data || [];
}

export async function deleteSession(userId: string, sessionId: string) {
  const { error } = await supabase
    .from('agent_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    if (isTableMissingError(error)) {
      tableMissing = true;
      memoryStore.sessions.delete(sessionId);
      memoryStore.messages.delete(sessionId);
      return;
    }
    console.error('[AgentService] Error deleting session:', error.message);
    throw new Error('Erro ao deletar sessão');
  }
}

export async function getSessionMessages(userId: string, sessionId: string) {
  const { data, error } = await supabase
    .from('agent_messages')
    .select('id, role, content, metadata, created_at')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    if (isTableMissingError(error)) {
      tableMissing = true;
      return memoryStore.messages.get(sessionId)?.map(m => ({ ...m, metadata: m.metadata ?? null })) ?? [];
    }
    console.error('[AgentService] Error getting session messages:', error.message);
    return [];
  }
  return data || [];
}

// ─── Rascunho de disparo (persistido por sessão) ────────────

async function loadDraft(userId: string, sessionId: string): Promise<CampaignDraft | null> {
  const { data, error } = await supabase
    .from('agent_sessions')
    .select('draft_campaign')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (isTableMissingError(error)) {
      return memoryStore.sessions.get(sessionId)?.draft_campaign ?? null;
    }
    return null;
  }
  return data?.draft_campaign ?? null;
}

async function saveDraft(userId: string, sessionId: string, draft: CampaignDraft | null) {
  const { error } = await supabase
    .from('agent_sessions')
    .update({ draft_campaign: draft })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error && isTableMissingError(error)) {
    const session = memoryStore.sessions.get(sessionId);
    if (session) session.draft_campaign = draft;
  }
}

// users.plan_id não existe — o plano ativo vive na tabela subscriptions.
async function getUserPlanId(userId: string): Promise<string> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.status === 'active' ? data.plan_id : 'free';
}

// ─── Memória de longo prazo (fatos sobre o corretor entre sessões) ──

const MAX_USER_FACTS = 20;

async function loadUserMemory(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('agent_user_memory')
    .select('facts')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isTableMissingError(error)) {
      return memoryStore.userFacts.get(userId) ?? [];
    }
    return [];
  }
  return (data?.facts as string[]) ?? [];
}

async function addUserFact(userId: string, fact: string): Promise<string[]> {
  const current = await loadUserMemory(userId);
  const normalized = fact.trim();
  if (!normalized) return current;

  // Evita duplicar fatos muito parecidos; mantém o mais recente no fim da lista.
  const deduped = current.filter(f => f.toLowerCase() !== normalized.toLowerCase());
  const updated = [...deduped, normalized].slice(-MAX_USER_FACTS);

  const { error } = await supabase
    .from('agent_user_memory')
    .upsert({ user_id: userId, facts: updated, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

  if (error && isTableMissingError(error)) {
    memoryStore.userFacts.set(userId, updated);
  }

  return updated;
}

// ─── Message persistence ────────────────────────────────────

async function persistMessage(userId: string, sessionId: string, role: string, content: string) {
  const { error } = await supabase
    .from('agent_messages')
    .insert({ user_id: userId, session_id: sessionId, role, content });

  if (error) {
    if (isTableMissingError(error)) {
      tableMissing = true;
      const msgs = memoryStore.messages.get(sessionId) ?? [];
      msgs.push({ id: crypto.randomUUID(), user_id: userId, session_id: sessionId, role, content, created_at: new Date() });
      memoryStore.messages.set(sessionId, msgs);
      return;
    }
    console.error(`[AgentService] Error persisting ${role} message:`, error.message);
  }
}

async function updateSessionTimestamp(userId: string, sessionId: string, title?: string) {
  const update: any = { updated_at: new Date().toISOString() };
  if (title !== undefined) update.title = title;

  const { error } = await supabase
    .from('agent_sessions')
    .update(update)
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    if (isTableMissingError(error)) {
      tableMissing = true;
      const session = memoryStore.sessions.get(sessionId);
      if (session) {
        session.updated_at = new Date();
        if (title !== undefined) session.title = title;
      }
      return;
    }
    console.error('[AgentService] Error updating session:', error.message);
  }
}

// ─── Agent chat ─────────────────────────────────────────────

interface ToolState {
  draft: CampaignDraft | null;
  component: AgentComponent | null;
  actions: Action[];
}

async function executeTool(
  userId: string,
  sessionId: string,
  planId: string,
  name: string,
  args: any,
  state: ToolState,
  lists: Array<{ id: string; name: string; leadCount: number }>,
  instances: Array<{ id: string; name: string; status: string }>,
  campaignsSummary: Array<{ id: string; name: string; status: string; total: number; sent: number; read: number; replied: number }>,
  stalledCount: number
): Promise<any> {
  switch (name) {
    case 'get_contact_lists':
      return { lists: lists.map(l => ({ name: l.name, leadCount: l.leadCount })) };

    case 'get_whatsapp_instances':
      return { instances: instances.map(i => ({ name: i.name, status: i.status })) };

    case 'get_campaign_stats':
      return { campaigns: campaignsSummary, stalledLeads: stalledCount };

    case 'update_campaign_draft': {
      state.draft = resolveDraftReferences(state.draft ?? {}, args || {}, lists, instances);
      state.draft = await recomputeDraftMeta(userId, planId, state.draft);
      await saveDraft(userId, sessionId, state.draft);
      state.component = state.component ?? deriveRiskComponent(state.draft);
      return { draftStatus: buildDraftChecklist(state.draft), readyToSend: state.draft.readyToSend, quota: state.draft.quota };
    }

    case 'request_contact_list_selection':
      state.component = { type: 'list_picker' };
      return { ok: true };

    case 'request_media_upload':
      state.component = { type: 'file_upload', purpose: 'media' };
      return { ok: true };

    case 'request_timing_confirmation': {
      const defaults = computeSmartDefaults(state.draft?.messageVariations, state.draft?.leadCount);
      state.component = {
        type: 'timing_confirm',
        purpose: JSON.stringify({
          delaySeconds: state.draft?.delaySeconds ?? defaults.delaySeconds,
          sequentialMode: state.draft?.sequentialMode ?? defaults.sequentialMode,
          blockDelay: state.draft?.blockDelay ?? defaults.blockDelay,
          batchSize: state.draft?.batchSize ?? 30,
          batchDelaySeconds: state.draft?.batchDelaySeconds ?? 60,
        }),
      };
      return { ok: true };
    }

    case 'request_schedule_confirmation':
      state.component = { type: 'schedule_picker', purpose: JSON.stringify({ scheduledAt: state.draft?.scheduledAt ?? null }) };
      return { ok: true };

    case 'request_instance_selection':
      state.component = { type: 'instance_picker' };
      return { ok: true };

    case 'request_message_variations_editor':
      state.component = {
        type: 'message_editor',
        purpose: JSON.stringify({ messageVariations: state.draft?.messageVariations ?? [] }),
      };
      return { ok: true };

    case 'request_contact_exclusion': {
      if (!state.draft?.contactListId) return { error: 'Ainda não há lista de contatos escolhida pra esse disparo.' };
      const contacts = await contactService.getAllContacts(userId, { listId: state.draft.contactListId });
      state.component = {
        type: 'contact_exclusion',
        purpose: JSON.stringify({
          contacts: contacts.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone })),
          excludedContactIds: state.draft?.excludedContactIds ?? [],
        }),
      };
      return { ok: true };
    }

    case 'request_followup_scheduler': {
      const stalledLeads = await campaignService.getStalledLeads(userId);
      state.component = { type: 'followup_scheduler', purpose: JSON.stringify({ stalledLeads }) };
      return { ok: true, stalledCount: stalledLeads.length };
    }

    case 'cancel_draft':
      state.draft = null;
      await saveDraft(userId, sessionId, null);
      return { ok: true };

    case 'suggest_connect_whatsapp':
      state.actions.push({ type: 'connect_whatsapp', title: 'Conectar WhatsApp' });
      return { ok: true };

    case 'suggest_confirm_campaign':
      // Rascunho pronto: mostra um resumo estruturado em vez de só um botão solto — o
      // corretor vê tudo que foi confirmado antes de disparar, mesmo se o painel lateral
      // estiver fechado/fora da tela (mobile).
      if (state.draft?.readyToSend) {
        state.component = { type: 'campaign_summary', purpose: JSON.stringify(state.draft) };
      }
      state.actions.push({ type: 'confirm_campaign', title: 'Confirmar disparo' });
      return { ok: true };

    case 'suggest_upgrade':
      state.actions.push({ type: 'suggest_upgrade', title: 'Ver planos' });
      return { ok: true };

    case 'suggest_import_leads':
      state.actions.push({ type: 'import_leads', title: 'Importar leads' });
      return { ok: true };

    case 'compare_campaign_performance': {
      const stats = await campaignService.getPerformanceStats(userId);
      if (stats.campaignCount === 0) {
        return { message: 'Nenhuma campanha enviada ainda, não há dados pra comparar.' };
      }

      const query = typeof args?.campaignName === 'string' ? args.campaignName.toLowerCase().trim() : '';
      const target = query
        ? stats.campaigns.find((c: any) => c.name.toLowerCase().includes(query))
        : null;

      return {
        campaignCount: stats.campaignCount,
        averageReplyRatePct: stats.avgReplyRatePct,
        averageReadRatePct: stats.avgReadRatePct,
        best: stats.best ? { name: stats.best.name, replyRatePct: stats.best.replyRatePct } : null,
        worst: stats.worst ? { name: stats.worst.name, replyRatePct: stats.worst.replyRatePct } : null,
        target: target ? { name: target.name, replyRatePct: target.replyRatePct, readRatePct: target.readRatePct, sent: target.sent, replied: target.replied } : (query ? 'Não encontrei campanha com esse nome.' : undefined),
      };
    }

    case 'remember_user_fact': {
      const fact = typeof args?.fact === 'string' ? args.fact : '';
      if (!fact.trim()) return { error: 'Fato vazio, nada foi salvo.' };
      const updated = await addUserFact(userId, fact);
      return { ok: true, totalFacts: updated.length };
    }

    case 'find_contact': {
      const query = typeof args?.query === 'string' ? args.query.trim() : '';
      if (!query) return { error: 'Informe um nome ou telefone pra buscar.' };
      const matches = await contactService.findContacts(userId, query);
      if (matches.length === 0) return { message: 'Nenhum contato encontrado com esse nome/telefone.' };
      if (matches.length > 1) {
        state.component = { type: 'lead_picker', purpose: JSON.stringify({ matches }) };
      }
      return { matches };
    }

    case 'suggest_message_rewrite': {
      return {
        guidance: [
          'Mantenha curto e natural, como se um corretor estivesse escrevendo, não uma propaganda.',
          'Evite excesso de emojis, links e tudo em maiúsculas — aumenta risco de spam no WhatsApp.',
          'Personalize com {nome} quando fizer sentido — é substituído automaticamente pelo nome de cada lead.',
          'Termine com uma pergunta aberta ou próximo passo claro, não só uma afirmação.',
        ],
      };
    }

    case 'duplicate_campaign': {
      const campaignName = typeof args?.campaignName === 'string' ? args.campaignName.trim() : '';
      if (!campaignName) return { error: 'Informe o nome da campanha a reaproveitar.' };
      const source = await campaignService.findCampaignByName(userId, campaignName);
      if (!source) return { message: `Não encontrei nenhuma campanha com o nome "${campaignName}".` };

      const instance = instances.find(i => i.id === source.instance_id);
      // Não grava o draft ainda — só mostra o que seria copiado e espera o usuário confirmar
      // pelo componente (apply_duplicated_campaign) antes de aplicar de fato.
      const pendingDraft: CampaignDraft = {
        name: `${source.name} (cópia)`,
        instanceId: source.instance_id || undefined,
        instanceName: instance?.name,
        instanceStatus: instance?.status,
        messageVariations: source.message_variations || undefined,
        mediaUrl: source.media_url || undefined,
        mediaType: source.media_type || undefined,
        delaySeconds: source.delay_seconds ?? undefined,
        sequentialMode: source.sequential_mode ?? undefined,
        blockDelay: source.block_delay ?? undefined,
      };
      state.component = { type: 'duplicate_campaign_confirm', purpose: JSON.stringify({ sourceName: source.name, pendingDraft }) };
      return { ok: true, foundCampaign: source.name };
    }

    case 'suggest_cancel_scheduled_campaign': {
      const campaignName = typeof args?.campaignName === 'string' ? args.campaignName.trim() : '';
      if (!campaignName) return { error: 'Informe o nome da campanha a cancelar.' };
      const target = await campaignService.findCampaignByName(userId, campaignName);
      if (!target) return { message: `Não encontrei nenhuma campanha com o nome "${campaignName}".` };
      if (target.status !== 'PENDING' && target.status !== 'PAUSED') {
        return { message: `A campanha "${target.name}" está com status "${target.status}" — só dá pra cancelar campanhas que ainda não começaram a enviar.` };
      }
      state.actions.push({ type: 'cancel_scheduled_campaign', title: `Cancelar "${target.name}"`, data: { campaignId: target.id } });
      return { ok: true, campaignName: target.name };
    }

    case 'list_connected_numbers': {
      const connected = instances.filter(i => i.status === 'connected');
      return {
        instances: instances.map(i => ({ name: i.name, status: i.status })),
        connectedCount: connected.length,
        totalCount: instances.length,
      };
    }

    case 'suggest_disconnect_whatsapp': {
      const instanceName = typeof args?.instanceName === 'string' ? args.instanceName.trim().toLowerCase() : '';
      if (!instanceName) return { error: 'Informe o nome do número a desconectar.' };
      const target = instances.find(i => i.name.toLowerCase().includes(instanceName));
      if (!target) return { message: `Não encontrei nenhum WhatsApp com o nome "${args.instanceName}".` };
      state.actions.push({ type: 'disconnect_whatsapp', title: `Desconectar "${target.name}"`, data: { instanceId: target.id } });
      return { ok: true, instanceName: target.name };
    }

    case 'check_quota_status': {
      if (QuotaService.isUnlimited(planId)) return { unlimited: true };
      const quota = await QuotaService.getCurrentQuota(userId, planId);
      return { unlimited: false, limit: quota.plan_limit, used: quota.messages_used, remaining: quota.messages_remaining };
    }

    case 'estimate_campaign_quota_impact': {
      if (QuotaService.isUnlimited(planId)) return { unlimited: true, message: 'Plano com disparos liberados — não consome cota.' };
      const availability = await QuotaService.checkAvailability(userId, planId, 1);
      return {
        unlimited: false,
        available: availability.available,
        remainingNow: availability.remaining,
        remainingAfterThisCampaign: Math.max(0, availability.remaining - 1),
        limit: availability.limit,
      };
    }

    case 'find_duplicate_contacts': {
      const groups = await contactService.findDuplicateContacts(userId);
      return groups.length > 0
        ? { duplicateGroups: groups.length, groups }
        : { message: 'Nenhum contato duplicado encontrado.' };
    }

    case 'suggest_merge_duplicate_contacts': {
      const groups = await contactService.findDuplicateContacts(userId);
      if (groups.length === 0) return { message: 'Nenhum contato duplicado encontrado — nada pra mesclar.' };
      state.actions.push({ type: 'merge_duplicate_contacts', title: `Mesclar ${groups.length} grupo(s) duplicado(s)` });
      return { ok: true, duplicateGroups: groups.length };
    }

    case 'check_instance_rate_limit': {
      const instanceName = typeof args?.instanceName === 'string' ? args.instanceName.trim().toLowerCase() : '';
      const target = instanceName
        ? instances.find(i => i.name.toLowerCase().includes(instanceName))
        : instances.find(i => i.id === state.draft?.instanceId);
      if (!target) return { message: 'Não encontrei esse WhatsApp — informe o nome ou defina o número no disparo primeiro.' };

      const { sentLast24h } = await campaignService.getInstanceSendVolume(userId, target.id);
      const risk = sentLast24h > 300 ? 'alto' : sentLast24h > 120 ? 'moderado' : 'baixo';
      return { instanceName: target.name, sentLast24h, risk };
    }

    default:
      return { error: `Ferramenta desconhecida: ${name}` };
  }
}

const MAX_TOOL_ITERATIONS = 5;

// ─── Conversão pro formato do Gemini (fallback) ──────────────
// Mantemos o histórico de mensagens sempre no formato OpenAI/Groq (é o que o
// loop de tools em chat() já monta) e só traduzimos na hora de chamar o Gemini.

function toGeminiSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  const out: any = {};
  for (const [key, value] of Object.entries(schema)) {
    out[key] = key === 'type' && typeof value === 'string' ? value.toUpperCase() : toGeminiSchema(value);
  }
  return out;
}

function openAiToolsToGemini(tools: typeof AGENT_TOOLS) {
  return [{
    functionDeclarations: tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      parameters: toGeminiSchema(t.function.parameters),
    })),
  }];
}

function safeParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function openAiMessagesToGemini(messages: any[]): { systemInstruction?: string; contents: any[] } {
  let systemInstruction: string | undefined;
  const contents: any[] = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemInstruction = m.content;
    } else if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content }] });
    } else if (m.role === 'assistant') {
      const parts: any[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.tool_calls) {
        for (const call of m.tool_calls) {
          parts.push({ functionCall: { name: call.function.name, args: safeParseJson(call.function.arguments || '{}') } });
        }
      }
      contents.push({ role: 'model', parts: parts.length ? parts : [{ text: '' }] });
    } else if (m.role === 'tool') {
      contents.push({
        role: 'function',
        parts: [{ functionResponse: { name: m.name || 'tool', response: safeParseJson(m.content) } }],
      });
    }
  }

  return { systemInstruction, contents };
}

function parseGeminiResponse(response: any): { content: string; tool_calls?: GroqToolCall[] } {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  let content = '';
  const toolCalls: GroqToolCall[] = [];

  for (const part of parts) {
    if (part.text) content += part.text;
    if (part.functionCall) {
      toolCalls.push({
        id: `gemini_${toolCalls.length}_${Date.now()}`,
        type: 'function',
        function: { name: part.functionCall.name, arguments: JSON.stringify(part.functionCall.args || {}) },
      });
    }
  }

  return { content, tool_calls: toolCalls.length > 0 ? toolCalls : undefined };
}

function extractGeminiUsage(response: any): { inputTokens: number; outputTokens: number } {
  const usage = response?.usageMetadata;
  return { inputTokens: usage?.promptTokenCount || 0, outputTokens: usage?.candidatesTokenCount || 0 };
}

async function callGeminiCompletion(
  workingMessages: any[],
  onToken?: (token: string) => void
): Promise<{ content: string; tool_calls?: GroqToolCall[]; usage: { inputTokens: number; outputTokens: number } }> {
  if (!geminiClient) throw new Error('Gemini not configured');

  const { systemInstruction, contents } = openAiMessagesToGemini(workingMessages);
  const model = geminiClient.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    tools: openAiToolsToGemini(AGENT_TOOLS) as any,
  });

  if (!onToken) {
    const result = await model.generateContent({ contents });
    return { ...parseGeminiResponse(result.response), usage: extractGeminiUsage(result.response) };
  }

  const emitSafeToken = createStreamSanitizer(onToken);
  const result = await model.generateContentStream({ contents });
  let content = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      content += text;
      emitSafeToken(text);
    }
  }
  const finalResponse = await result.response;
  const { tool_calls } = parseGeminiResponse(finalResponse);
  return { content, tool_calls, usage: extractGeminiUsage(finalResponse) };
}

// ─── Dispatcher com fallback automático ──────────────────────

async function callLLM(
  workingMessages: any[],
  onToken?: (token: string) => void
): Promise<{ content: string; tool_calls?: GroqToolCall[]; usage: { inputTokens: number; outputTokens: number }; provider: string; model: string }> {
  if (GROQ_API_KEY) {
    try {
      const result = await callGroqCompletion(workingMessages, onToken);
      return { ...result, provider: 'groq', model: GROQ_MODEL };
    } catch (error: any) {
      if (!geminiClient) throw error;
      console.warn('[AgentService] Groq falhou, usando Gemini como fallback:', error.message);
    }
  } else if (!geminiClient) {
    throw new Error('Nenhum provedor de IA configurado (GROQ_API_KEY ou GEMINI_API_KEY)');
  }

  const result = await callGeminiCompletion(workingMessages, onToken);
  return { ...result, provider: 'gemini', model: GEMINI_MODEL };
}

async function callGroqCompletion(
  workingMessages: any[],
  onToken?: (token: string) => void
): Promise<{ content: string; tool_calls?: GroqToolCall[]; usage: { inputTokens: number; outputTokens: number } }> {
  const useStream = typeof onToken === 'function';

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: workingMessages,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 1024,
      ...(useStream ? { stream: true, stream_options: { include_usage: true } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[AgentService] Groq API error: ${response.status} ${errorText}`);
    throw new Error(`Erro na comunicação com a IA: ${response.status}`);
  }

  if (!useStream || !response.body) {
    const data = (await response.json()) as GroqResponse & { usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error('Resposta vazia da IA');
    return {
      content: message.content || '',
      tool_calls: message.tool_calls,
      usage: { inputTokens: data.usage?.prompt_tokens || 0, outputTokens: data.usage?.completion_tokens || 0 },
    };
  }

  // Streaming: acumula deltas de conteúdo e de tool_calls (indexados) até o fim do stream.
  // Tokens de conteúdo passam pelo sanitizador antes de chegar no callback do chamador.
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  const toolCallsAcc: Record<number, { id?: string; name?: string; arguments: string }> = {};
  let usage = { inputTokens: 0, outputTokens: 0 };

  const emitSafeToken = createStreamSanitizer((safeToken) => onToken!(safeToken));

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;

      let json: any;
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }

      if (json.usage) {
        usage = { inputTokens: json.usage.prompt_tokens || 0, outputTokens: json.usage.completion_tokens || 0 };
      }

      const delta = json.choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        content += delta.content;
        emitSafeToken(delta.content);
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCallsAcc[idx]) toolCallsAcc[idx] = { arguments: '' };
          if (tc.id) toolCallsAcc[idx].id = tc.id;
          if (tc.function?.name) toolCallsAcc[idx].name = (toolCallsAcc[idx].name || '') + tc.function.name;
          if (tc.function?.arguments) toolCallsAcc[idx].arguments += tc.function.arguments;
        }
      }
    }
  }

  const toolCalls: GroqToolCall[] = Object.values(toolCallsAcc)
    .filter((tc): tc is { id: string; name?: string; arguments: string } => Boolean(tc.id))
    .map(tc => ({ id: tc.id, type: 'function' as const, function: { name: tc.name || '', arguments: tc.arguments } }));

  return { content, tool_calls: toolCalls.length > 0 ? toolCalls : undefined, usage };
}

// Llama 3.x às vezes "vaza" uma tentativa de tool call como pseudo-XML dentro do
// próprio texto (ex: <function=nome>{...}</function>) em vez de usar tool_calls
// estruturado. Isso nunca deve chegar ao usuário — remove como rede de segurança.
function stripLeakedToolSyntax(text: string): string {
  return text
    .replace(/<function=[^>]*>[\s\S]*?<\/function>/gi, '')
    .replace(/<\|?tool_call\|?>[\s\S]*?<\/\|?tool_call\|?>/gi, '')
    .trim();
}

// Filtro pra streaming: mesmo risco do stripLeakedToolSyntax, mas token a token — se
// deixássemos passar direto, o usuário veria o "<function=...>" piscando na tela antes
// de conseguirmos remover. Bufferiza qualquer coisa que comece com "<" até confirmar se
// é uma tag suspeita (aí suprime até o fechamento) ou texto normal (aí libera).
function createStreamSanitizer(onSafeToken: (token: string) => void) {
  let pending = '';
  let suppressing = false;
  const OPEN_PATTERNS = [/^<function=/i, /^<\|?tool_call\|?>/i];
  const CLOSE_PATTERN = /<\/function>|<\/\|?tool_call\|?>/i;
  const MAX_PREFIX = '<|tool_call|>'.length; // maior prefixo entre os padrões acima

  return (token: string) => {
    pending += token;

    while (pending.length > 0) {
      if (suppressing) {
        const closeMatch = pending.match(CLOSE_PATTERN);
        if (!closeMatch) {
          pending = '';
          return;
        }
        pending = pending.slice((closeMatch.index ?? 0) + closeMatch[0].length);
        suppressing = false;
        continue;
      }

      const openIdx = pending.indexOf('<');
      if (openIdx === -1) {
        onSafeToken(pending);
        pending = '';
        return;
      }

      if (openIdx > 0) {
        onSafeToken(pending.slice(0, openIdx));
        pending = pending.slice(openIdx);
      }

      // pending agora começa com "<"
      if (OPEN_PATTERNS.some(p => p.test(pending))) {
        suppressing = true;
        continue;
      }

      // Ainda não dá pra saber se vira uma tag suspeita — espera mais tokens chegarem.
      if (pending.length < MAX_PREFIX) {
        return;
      }

      // Não bateu com nenhum padrão suspeito e já temos caracteres suficientes: é "<" normal.
      onSafeToken(pending[0]);
      pending = pending.slice(1);
    }
  };
}

interface ToolLoopContext {
  userId: string;
  sessionId: string;
  planId: string;
  lists: Array<{ id: string; name: string; leadCount: number }>;
  instances: Array<{ id: string; name: string; status: string }>;
  campaignsSummary: Array<{ id: string; name: string; status: string; total: number; sent: number; read: number; replied: number }>;
  stalledCount: number;
}

async function runToolLoop(
  workingMessages: any[],
  ctx: ToolLoopContext,
  state: ToolState,
  onToken?: (token: string) => void,
  onReset?: () => void
): Promise<string> {
  let finalReply = '';

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    console.log(`[AgentService] Calling LLM for user ${ctx.userId} session=${ctx.sessionId} iteration=${iteration}`);

    const { content, tool_calls, usage, provider, model } = await callLLM(workingMessages, onToken);
    logAiCost({ userId: ctx.userId, sessionId: ctx.sessionId, provider, model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens });
    const message = { role: 'assistant', content, tool_calls };

    workingMessages.push(message);

    if (message.tool_calls && message.tool_calls.length > 0) {
      // O modelo às vezes narra ("Vou verificar...") no mesmo turno em que chama uma tool.
      // Como esse texto não é a resposta final, se algo foi streamado ao vivo pro cliente
      // nesse turno, avisa pra ele descartar e recomeçar limpo na próxima leva de tokens.
      if (content && onReset) onReset();

      for (const call of message.tool_calls) {
        let args: any = {};
        try {
          args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          args = {};
        }

        let result: any;
        try {
          result = await executeTool(ctx.userId, ctx.sessionId, ctx.planId, call.function.name, args, state, ctx.lists, ctx.instances, ctx.campaignsSummary, ctx.stalledCount);
        } catch (toolError: any) {
          console.error(`[AgentService] Tool ${call.function.name} failed for user ${ctx.userId}:`, toolError.message);
          result = { error: 'Falha ao executar a ferramenta.' };
        }

        workingMessages.push({ role: 'tool', tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result) });
      }
      continue;
    }

    finalReply = stripLeakedToolSyntax(message.content || '');
    break;
  }

  return finalReply || 'Desculpa, não consegui montar uma resposta agora. Pode reformular?';
}

// Chamado depois que o usuário interage com um componente visual (escolher lista,
// anexar mídia) — essas ações são determinísticas (executeAction), mas sem isso a
// conversa "morria" ali: o usuário via só uma confirmação seca e ficava sem saber
// o próximo passo, porque nenhuma chamada ao LLM acontecia depois da ação.
async function continueAfterAction(
  userId: string,
  sessionId: string,
  eventDescription: string
): Promise<{ reply: string; actions: Action[]; draft: CampaignDraft | null; component: AgentComponent | null }> {
  if (!GROQ_API_KEY && !geminiClient) {
    return { reply: '', actions: [], draft: await loadDraft(userId, sessionId), component: null };
  }

  try {
    const [ctx, lists, instances, existingDraft, persistedMessages, campaignsSummary, stalledCount, memoryFacts, brokerContext] = await Promise.all([
      buildContext(userId),
      contactService.getListsWithCounts(userId),
      instanceService.getInstances(userId),
      loadDraft(userId, sessionId),
      getSessionMessages(userId, sessionId),
      campaignService.getCampaignsSummary(userId),
      campaignService.getStalledLeadsCount(userId),
      loadUserMemory(userId),
      buildBrokerContext(userId),
    ]);

    const systemPrompt = buildSystemPrompt(ctx, existingDraft, memoryFacts, brokerContext);
    const dbHistory: ChatMessage[] = persistedMessages
      .slice(-20)
      .map((m: any) => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content }));

    const workingMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...dbHistory,
      { role: 'user', content: `[EVENTO DO SISTEMA — não é fala do usuário] ${eventDescription} Continue a conversa naturalmente: confirme brevemente e faça a próxima pergunta necessária (veja o checklist), ou diga que está tudo pronto se não faltar nada. Nunca termine sem dar um próximo passo claro.` },
    ];

    const state: ToolState = { draft: existingDraft, component: null, actions: [] };
    const loopCtx: ToolLoopContext = { userId, sessionId, planId: ctx.planId, lists, instances, campaignsSummary, stalledCount };
    const finalReply = await runToolLoop(workingMessages, loopCtx, state);

    // Essa mensagem não é persistida como 'user' (evitaria mostrar o texto de evento
    // interno como se o usuário tivesse digitado isso ao recarregar a conversa).
    await persistMessage(userId, sessionId, 'agent', finalReply);
    await updateSessionTimestamp(userId, sessionId);

    return { reply: finalReply, actions: state.actions, draft: state.draft, component: state.component };
  } catch (error: any) {
    console.error(`[AgentService] continueAfterAction error for user ${userId}:`, error.message);
    return { reply: '', actions: [], draft: await loadDraft(userId, sessionId), component: null };
  }
}

export async function chat(
  userId: string,
  userMessage: string,
  history: ChatMessage[] = [],
  sessionId?: string,
  onToken?: (token: string) => void,
  onReset?: () => void
): Promise<{ reply: string; actions: Action[]; draft: CampaignDraft | null; component: AgentComponent | null; history: ChatMessage[]; sessionId: string }> {
  let currentSessionId: string;
  if (sessionId) {
    currentSessionId = sessionId;
  } else {
    const session = await createSession(userId);
    currentSessionId = session.id;
  }

  if (!GROQ_API_KEY && !geminiClient) {
    const reply = 'Olá! 👋 Para eu poder ajudar, preciso que você configure a chave da IA (GROQ_API_KEY ou GEMINI_API_KEY) no arquivo .env do sistema. Peça pro seu desenvolvedor ou administrador adicionar essa chave.';
    await persistMessage(userId, currentSessionId, 'user', userMessage);
    await persistMessage(userId, currentSessionId, 'agent', reply);
    return {
      reply,
      actions: [],
      draft: null,
      component: null,
      history: [
        ...history,
        { role: 'user' as const, content: userMessage },
        { role: 'assistant' as const, content: reply },
      ],
      sessionId: currentSessionId,
    };
  }

  try {
    const [ctx, lists, instances, existingDraft, persistedMessages, campaignsSummary, stalledCount, memoryFacts, brokerContext] = await Promise.all([
      buildContext(userId),
      contactService.getListsWithCounts(userId),
      instanceService.getInstances(userId),
      loadDraft(userId, currentSessionId),
      getSessionMessages(userId, currentSessionId),
      campaignService.getCampaignsSummary(userId),
      campaignService.getStalledLeadsCount(userId),
      loadUserMemory(userId),
      buildBrokerContext(userId),
    ]);

    const systemPrompt = buildSystemPrompt(ctx, existingDraft, memoryFacts, brokerContext);

    // O histórico vem sempre do banco (fonte confiável), não do parâmetro `history` do
    // chamador — o frontend não estava enviando isso, o que deixava o agente sem memória
    // nenhuma da conversa. Mantém as últimas 20 mensagens pra não estourar o contexto.
    const dbHistory: ChatMessage[] = persistedMessages
      .slice(-20)
      .map((m: any) => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content }));

    const workingMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...dbHistory,
      { role: 'user', content: userMessage },
    ];

    const state: ToolState = { draft: existingDraft, component: null, actions: [] };
    const loopCtx: ToolLoopContext = { userId, sessionId: currentSessionId, planId: ctx.planId, lists, instances, campaignsSummary, stalledCount };
    const finalReply = await runToolLoop(workingMessages, loopCtx, state, onToken, onReset);

    // Rede de segurança: se existe um disparo em andamento sem mensagem ainda, e o usuário
    // escreveu algo entre aspas nesse turno, captura como mensagem mesmo se o modelo não
    // tiver chamado update_campaign_draft (às vezes ele não reconhece o texto como a mensagem).
    if (state.draft && !state.draft.messageVariations?.length) {
      const quoted = extractQuotedMessage(userMessage);
      if (quoted) {
        state.draft.messageVariations = [quoted];
        state.draft = await recomputeDraftMeta(userId, ctx.planId, state.draft);
        await saveDraft(userId, currentSessionId, state.draft);
      }
    }

    // Componente de seleção de lista é determinístico: se o modelo não chamou a tool mas
    // o assunto de lista/contatos veio à tona e ainda falta lista, mostra o seletor mesmo assim.
    if (!state.component && state.draft && !state.draft.contactListId && messageReferencesContacts(userMessage)) {
      state.component = { type: 'list_picker' };
    }

    await persistMessage(userId, currentSessionId, 'user', userMessage);
    await persistMessage(userId, currentSessionId, 'agent', finalReply);

    const existingMsgs = await getSessionMessages(userId, currentSessionId);
    const isFirstMessage = existingMsgs.length <= 2;
    if (isFirstMessage) {
      const title = userMessage.substring(0, 60) + (userMessage.length > 60 ? '...' : '');
      await updateSessionTimestamp(userId, currentSessionId, title);
    } else {
      await updateSessionTimestamp(userId, currentSessionId);
    }

    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: finalReply },
    ];

    return {
      reply: finalReply,
      actions: state.actions,
      draft: state.draft,
      component: state.component,
      history: updatedHistory,
      sessionId: currentSessionId,
    };
  } catch (error: any) {
    console.error(`[AgentService] Error for user ${userId}:`, error.message);

    const fallbackReply = 'Desculpa, tive um problema ao processar sua mensagem. Pode tentar de novo?';
    await persistMessage(userId, currentSessionId, 'user', userMessage);
    await persistMessage(userId, currentSessionId, 'agent', fallbackReply);
    // Mesmo numa falha de IA, o rascunho já salvo não pode sumir da tela — só
    // recarrega o que já existe, não inventa nem descarta nada.
    const existingDraft = await loadDraft(userId, currentSessionId).catch(() => null);
    return {
      reply: fallbackReply,
      actions: [],
      draft: existingDraft,
      component: null,
      history: [
        ...history,
        { role: 'user' as const, content: userMessage },
        { role: 'assistant' as const, content: fallbackReply },
      ],
      sessionId: currentSessionId,
    };
  }
}

export async function getSuggestions(userId: string): Promise<Array<{ icon: string; title: string; desc: string; action: string }>> {
  if (!GROQ_API_KEY) {
    return [
      { icon: 'rocket', title: 'Criar campanha', desc: 'Comece um disparo para seus leads', action: 'start_dispatch' },
      { icon: 'upload', title: 'Importar contatos', desc: 'Adicione leads à sua base', action: 'import_leads' },
      { icon: 'wifi', title: 'Conectar WhatsApp', desc: 'Vincule seu número à plataforma', action: 'connect_whatsapp' },
    ];
  }

  try {
    const ctx = await buildContext(userId);

    const { data: instances } = await supabase
      .from('instances')
      .select('status')
      .eq('user_id', userId);
    const connectedInstances = instances?.filter(i => i.status === 'connected').length || 0;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Você é o ZapBroker, assistente de corretores de imóveis.
Gere exatamente 3 sugestões contextualizadas para o usuário com base nos dados abaixo.

REGRAS:
- Se o usuário NÃO tem leads: sugira importar contatos.
- Se tem leads mas NUNCA criou campanha: sugira criar a primeira campanha.
- Se tem campanhas criadas: sugira analisar resultados ou criar follow-up.
- Se NÃO tem WhatsApp conectado: sugira conectar.
- Se já tem WhatsApp conectado e leads: incentive a criar campanha.
- Nunca sugira upgrade de plano.
- Nunca repita a mesma sugestão duas vezes.
- As sugestões devem ser curtas, diretas e em português.

Retorne APENAS um JSON array sem markdown, sem texto extra:
[{ "icon": "rocket|upload|wifi|target|trending|alert|send", "title": "Título curto", "desc": "Descrição de uma linha", "action": "start_dispatch|import_leads|connect_whatsapp|view_campaigns|suggest_followup|follow_up_stalled" }]

Dados do usuário:
- Nome: ${ctx.userName}
- Leads na base: ${ctx.leadCount}
- Campanhas criadas: ${ctx.campaignCount}
- WhatsApps conectados: ${connectedInstances}
- Plano atual: ${ctx.currentPlan}`
      }
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getSuggestions] Groq API error:', response.status, errorText);
      throw new Error('Erro na comunicação com a IA');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return suggestions.slice(0, 4);
    }

    return [];
  } catch (error: any) {
    console.error('[getSuggestions] Error:', error.message);
    return [];
  }
}

export async function executeAction(
  userId: string,
  actionType: string,
  data?: any
): Promise<{ success: boolean; message: string; result?: any }> {
  console.log(`[AgentService] Executing action ${actionType} for user ${userId}`);

  switch (actionType) {
    case 'connect_whatsapp': {
      try {
        const instances = await instanceService.getInstances(userId);
        // Reconecta um número que já existe mas está desconectado, em vez de
        // sempre reaproveitar o primeiro — assim dá pra adicionar mais números.
        let instance = instances.find((i: any) => i.status !== 'connected');

        if (!instance) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan_id, status')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();
          const planId = sub?.plan_id;
          const limits = (planId && PLAN_LIMITS[planId]) || DEFAULT_LIMITS;

          if (instances.length >= limits.maxInstances) {
            return {
              success: false,
              message: instances.length === 0
                ? 'Você precisa de um plano ativo para conectar um WhatsApp.'
                : `Seu plano permite até ${limits.maxInstances} número(s) de WhatsApp conectado(s), e você já usou todos. Faça upgrade pra conectar mais um.`,
            };
          }

          instance = await instanceService.createInstance(userId, `WhatsApp ${instances.length + 1}`);
        }

        const { base64 } = await instanceService.connectInstance(userId, instance.id);

        return {
          success: true,
          message: 'Escaneie o QR Code abaixo com seu WhatsApp para conectar:',
          result: { type: 'whatsapp_qr', instanceId: instance.id, qrCode: base64 || null, alreadyConnected: false },
        };
      } catch (error: any) {
        console.error(`[AgentService] connect_whatsapp error for user ${userId}:`, error.message);
        return {
          success: false,
          message: 'Não consegui gerar o QR Code agora. Pode tentar de novo em alguns segundos?',
        };
      }
    }

    case 'import_leads': {
      return {
        success: true,
        message: 'Vamos importar seus leads!',
        result: {
          redirect: '/dashboard/leads',
          action: 'open_import_modal',
        },
      };
    }

    case 'suggest_upgrade': {
      return {
        success: true,
        message: 'Que tal fazer um upgrade de plano?',
        result: {
          redirect: '/dashboard/upgrade',
          action: 'open_pricing',
        },
      };
    }

    case 'cancel_scheduled_campaign': {
      const campaignId = data?.campaignId;
      if (!campaignId) return { success: false, message: 'Não identifiquei qual campanha cancelar.' };
      try {
        const campaign = await campaignService.cancelScheduledCampaign(userId, campaignId);
        try {
          const planId = await getUserPlanId(userId);
          if (planId) await QuotaService.refundQuota(userId, planId, 1, campaignId, 'Campanha cancelada antes de enviar');
        } catch (refundError: any) {
          console.error('[AgentService] Error refunding quota on cancel:', refundError.message);
        }
        return { success: true, message: `Campanha "${campaign.name}" cancelada. A cota usada por ela foi devolvida.` };
      } catch (error: any) {
        return { success: false, message: error.message || 'Não consegui cancelar essa campanha.' };
      }
    }

    case 'disconnect_whatsapp': {
      const instanceId = data?.instanceId;
      if (!instanceId) return { success: false, message: 'Não identifiquei qual número desconectar.' };
      try {
        await instanceService.logoutInstance(userId, instanceId);
        return { success: true, message: 'WhatsApp desconectado.' };
      } catch (error: any) {
        return { success: false, message: error.message || 'Não consegui desconectar esse número.' };
      }
    }

    case 'merge_duplicate_contacts': {
      try {
        const { mergedGroups, removedContacts } = await contactService.mergeDuplicateContacts(userId);
        return mergedGroups > 0
          ? { success: true, message: `Mesclei ${mergedGroups} grupo(s) duplicado(s), removendo ${removedContacts} contato(s) repetido(s).` }
          : { success: true, message: 'Não encontrei mais duplicados pra mesclar.' };
      } catch (error: any) {
        return { success: false, message: error.message || 'Não consegui mesclar os duplicados agora.' };
      }
    }

    case 'set_draft_list': {
      const sessionId = data?.sessionId;
      const contactListId = data?.contactListId;
      if (!sessionId || !contactListId) {
        return { success: false, message: 'Faltou identificar a sessão ou a lista escolhida.' };
      }

      try {
        const [lists, existingDraft, planId] = await Promise.all([
          contactService.getListsWithCounts(userId),
          loadDraft(userId, sessionId),
          getUserPlanId(userId),
        ]);

        const list = lists.find(l => l.id === contactListId);
        if (!list) {
          return { success: false, message: 'Não achei essa lista de contatos.' };
        }

        let draft: CampaignDraft = { ...(existingDraft ?? {}), contactListId: list.id, contactListName: list.name, leadCount: list.leadCount };
        const defaults = computeSmartDefaults(draft.messageVariations, draft.leadCount);
        if (draft.delaySeconds === undefined) draft.delaySeconds = defaults.delaySeconds;
        if (draft.sequentialMode === undefined) draft.sequentialMode = defaults.sequentialMode;
        if (draft.blockDelay === undefined) draft.blockDelay = defaults.blockDelay;

        draft = await recomputeDraftMeta(userId, planId, draft);
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          `O usuário acabou de escolher a lista de contatos "${list.name}" (${list.leadCount} leads) através do seletor visual.`
        );

        return {
          success: true,
          message: followUp.reply || `Lista "${list.name}" selecionada (${list.leadCount} leads).`,
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: deriveRiskComponent(draft) ?? followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] set_draft_list error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui vincular essa lista agora. Tenta de novo?' };
      }
    }

    case 'set_draft_media': {
      const sessionId = data?.sessionId;
      if (!sessionId) {
        return { success: false, message: 'Faltou identificar a sessão do disparo.' };
      }

      try {
        const [existingDraft, planId] = await Promise.all([
          loadDraft(userId, sessionId),
          getUserPlanId(userId),
        ]);

        let draft: CampaignDraft = { ...(existingDraft ?? {}) };
        draft.mediaUrl = data?.mediaUrl ?? null;
        draft.mediaType = data?.mediaUrl ? (data?.mediaType || draft.mediaType) : undefined;

        draft = await recomputeDraftMeta(userId, planId, draft);
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          draft.mediaUrl
            ? `O usuário acabou de anexar uma mídia (${draft.mediaType || 'arquivo'}) ao disparo através do seletor visual.`
            : 'O usuário acabou de remover a mídia anexada ao disparo.'
        );

        return {
          success: true,
          message: followUp.reply || (draft.mediaUrl ? 'Mídia anexada ao disparo!' : 'Mídia removida do disparo.'),
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] set_draft_media error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui atualizar a mídia agora. Tenta de novo?' };
      }
    }

    case 'set_draft_timing': {
      const sessionId = data?.sessionId;
      if (!sessionId) {
        return { success: false, message: 'Faltou identificar a sessão do disparo.' };
      }

      try {
        const [existingDraft, planId] = await Promise.all([
          loadDraft(userId, sessionId),
          getUserPlanId(userId),
        ]);

        let draft: CampaignDraft = { ...(existingDraft ?? {}) };
        draft.delaySeconds = Number(data?.delaySeconds) || draft.delaySeconds || 5;
        draft.sequentialMode = Boolean(data?.sequentialMode);
        draft.blockDelay = Number(data?.blockDelay) || draft.blockDelay || 5;
        draft.batchSize = Number(data?.batchSize) || draft.batchSize || 30;
        draft.batchDelaySeconds = Number(data?.batchDelaySeconds) || draft.batchDelaySeconds || 60;
        draft.timingConfirmed = true;

        draft = await recomputeDraftMeta(userId, planId, draft);
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          `O usuário acabou de confirmar o timing do disparo através do seletor visual: ${draft.delaySeconds}s entre mensagens, ${draft.sequentialMode ? 'modo sequencial ligado' : 'modo sequencial desligado'}, lotes de ${draft.batchSize} leads a cada ${draft.batchDelaySeconds}s.`
        );

        return {
          success: true,
          message: followUp.reply || 'Timing confirmado!',
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] set_draft_timing error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui salvar essa configuração agora. Tenta de novo?' };
      }
    }

    case 'set_draft_schedule': {
      const sessionId = data?.sessionId;
      if (!sessionId) return { success: false, message: 'Faltou identificar a sessão do disparo.' };

      try {
        const existingDraft = await loadDraft(userId, sessionId);
        const draft: CampaignDraft = { ...(existingDraft ?? {}) };
        draft.scheduledAt = data?.scheduledAt ?? null;
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          draft.scheduledAt
            ? `O usuário acabou de agendar o disparo pra ${draft.scheduledAt} através do seletor visual.`
            : 'O usuário acabou de confirmar que quer enviar o disparo imediatamente (sem agendamento).'
        );

        return {
          success: true,
          message: followUp.reply || 'Agendamento confirmado!',
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] set_draft_schedule error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui salvar o agendamento agora. Tenta de novo?' };
      }
    }

    case 'set_draft_instances': {
      const sessionId = data?.sessionId;
      const instanceIds: string[] = Array.isArray(data?.instanceIds) ? data.instanceIds : [];
      if (!sessionId || instanceIds.length === 0) {
        return { success: false, message: 'Faltou escolher pelo menos um WhatsApp.' };
      }

      try {
        const [existingDraft, planId, instances] = await Promise.all([
          loadDraft(userId, sessionId),
          getUserPlanId(userId),
          instanceService.getInstances(userId),
        ]);

        const chosen = instances.filter((i: any) => instanceIds.includes(i.id));
        if (chosen.length === 0) return { success: false, message: 'Não achei esse(s) WhatsApp(s).' };

        let draft: CampaignDraft = { ...(existingDraft ?? {}) };
        if (chosen.length === 1) {
          draft.instanceId = chosen[0].id;
          draft.instanceName = chosen[0].name;
          draft.instanceStatus = chosen[0].status;
          draft.instanceIds = undefined;
          draft.instanceNames = undefined;
        } else {
          draft.instanceIds = chosen.map((i: any) => i.id);
          draft.instanceNames = chosen.map((i: any) => i.name);
          draft.instanceId = chosen[0].id;
          draft.instanceName = chosen[0].name;
          draft.instanceStatus = chosen[0].status;
        }

        draft = await recomputeDraftMeta(userId, planId, draft);
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          `O usuário acabou de escolher o(s) WhatsApp(s) ${chosen.map((i: any) => i.name).join(', ')} através do seletor visual.`
        );

        return {
          success: true,
          message: followUp.reply || 'WhatsApp(s) selecionado(s)!',
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: deriveRiskComponent(draft) ?? followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] set_draft_instances error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui vincular esse(s) WhatsApp(s) agora. Tenta de novo?' };
      }
    }

    case 'set_draft_messages': {
      const sessionId = data?.sessionId;
      const messageVariations: string[] = Array.isArray(data?.messageVariations)
        ? data.messageVariations.filter((m: any) => typeof m === 'string' && m.trim().length > 0)
        : [];
      if (!sessionId || messageVariations.length === 0) {
        return { success: false, message: 'Faltou pelo menos uma variação de mensagem.' };
      }

      try {
        const [existingDraft, planId] = await Promise.all([
          loadDraft(userId, sessionId),
          getUserPlanId(userId),
        ]);

        let draft: CampaignDraft = { ...(existingDraft ?? {}), messageVariations };
        draft = await recomputeDraftMeta(userId, planId, draft);
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          `O usuário acabou de editar as mensagens do disparo através do editor visual — agora são ${messageVariations.length} variação(ões).`
        );

        return {
          success: true,
          message: followUp.reply || 'Mensagens atualizadas!',
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] set_draft_messages error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui salvar essas mensagens agora. Tenta de novo?' };
      }
    }

    case 'set_draft_exclusions': {
      const sessionId = data?.sessionId;
      const excludedContactIds: string[] = Array.isArray(data?.excludedContactIds) ? data.excludedContactIds : [];
      if (!sessionId) return { success: false, message: 'Faltou identificar a sessão do disparo.' };

      try {
        const existingDraft = await loadDraft(userId, sessionId);
        const draft: CampaignDraft = { ...(existingDraft ?? {}), excludedContactIds };
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          excludedContactIds.length > 0
            ? `O usuário acabou de excluir ${excludedContactIds.length} lead(s) desse disparo através do seletor visual.`
            : 'O usuário acabou de limpar a lista de exclusões desse disparo.'
        );

        return {
          success: true,
          message: followUp.reply || 'Exclusões atualizadas!',
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] set_draft_exclusions error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui salvar as exclusões agora. Tenta de novo?' };
      }
    }

    case 'apply_duplicated_campaign': {
      const sessionId = data?.sessionId;
      const pendingDraft = data?.pendingDraft;
      if (!sessionId || !pendingDraft) {
        return { success: false, message: 'Faltou identificar a campanha a reaproveitar.' };
      }

      try {
        const planId = await getUserPlanId(userId);
        let draft: CampaignDraft = { ...(pendingDraft as CampaignDraft) };
        draft = await recomputeDraftMeta(userId, planId, draft);
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          `O usuário confirmou que quer reaproveitar a campanha "${data?.sourceName}" como base — agora só falta escolher uma nova lista de contatos.`
        );

        return {
          success: true,
          message: followUp.reply || 'Feito! Agora é só escolher a lista de contatos pra esse disparo.',
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] apply_duplicated_campaign error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui aplicar essa campanha agora. Tenta de novo?' };
      }
    }

    case 'cancel_duplicated_campaign': {
      const sessionId = data?.sessionId;
      if (!sessionId) return { success: false, message: 'Faltou identificar a sessão.' };

      try {
        // Nada foi salvo ainda (duplicate_campaign só emite o componente, não grava o
        // draft) — só avisa o agente pra ele continuar a conversa a partir daqui.
        const followUp = await continueAfterAction(
          userId,
          sessionId,
          'O usuário decidiu não reaproveitar essa campanha antiga. Pergunte o que ele quer fazer agora.'
        );

        return {
          success: true,
          message: followUp.reply || 'Sem problemas! O que você quer fazer agora?',
          result: { draft: followUp.draft, actions: followUp.actions, component: followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] cancel_duplicated_campaign error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui processar isso agora. Tenta de novo?' };
      }
    }

    case 'acknowledge_antiban_warning': {
      const sessionId = data?.sessionId;
      if (!sessionId) return { success: false, message: 'Faltou identificar a sessão do disparo.' };

      try {
        const [existingDraft, planId] = await Promise.all([loadDraft(userId, sessionId), getUserPlanId(userId)]);
        let draft: CampaignDraft = { ...(existingDraft ?? {}), antiBanAcknowledged: true };
        draft = await recomputeDraftMeta(userId, planId, draft);
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          'O usuário confirmou que quer continuar o disparo mesmo com o aviso de risco de bloqueio (lista grande num único número).'
        );

        return {
          success: true,
          message: followUp.reply || 'Combinado, seguindo com essa configuração.',
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] acknowledge_antiban_warning error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui confirmar isso agora. Tenta de novo?' };
      }
    }

    case 'acknowledge_quota_warning': {
      const sessionId = data?.sessionId;
      if (!sessionId) return { success: false, message: 'Faltou identificar a sessão do disparo.' };

      try {
        const [existingDraft, planId] = await Promise.all([loadDraft(userId, sessionId), getUserPlanId(userId)]);
        let draft: CampaignDraft = { ...(existingDraft ?? {}), quotaAcknowledged: true };
        draft = await recomputeDraftMeta(userId, planId, draft);
        await saveDraft(userId, sessionId, draft);

        const followUp = await continueAfterAction(
          userId,
          sessionId,
          'O usuário confirmou que quer usar sua última campanha disponível do mês mesmo assim.'
        );

        return {
          success: true,
          message: followUp.reply || 'Combinado, seguindo com essa configuração.',
          result: { draft: followUp.draft || draft, actions: followUp.actions, component: followUp.component },
        };
      } catch (error: any) {
        console.error(`[AgentService] acknowledge_quota_warning error for user ${userId}:`, error.message);
        return { success: false, message: 'Não consegui confirmar isso agora. Tenta de novo?' };
      }
    }

    case 'create_followup': {
      const contactIds: string[] = Array.isArray(data?.contactIds) ? data.contactIds : [];
      const message = typeof data?.message === 'string' ? data.message.trim() : '';
      const scheduledAt = data?.scheduledAt ?? undefined;
      if (contactIds.length === 0 || !message) {
        return { success: false, message: 'Faltou escolher os leads e escrever a mensagem de follow-up.' };
      }

      try {
        const instances = await instanceService.getInstances(userId);
        const connected = instances.find((i: any) => i.status === 'connected');
        if (!connected) {
          return { success: false, message: 'Você precisa de um WhatsApp conectado pra enviar o follow-up.' };
        }

        // Os leads parados podem vir de listas diferentes — createCampaign exige uma lista só,
        // então agrupamos por lista e disparamos só pros contatos escolhidos de cada uma
        // (via exclusão invertida: exclui todo mundo da lista que NÃO foi escolhido).
        const { data: contactRows, error: contactsError } = await supabase
          .from('contacts')
          .select('id, list_id')
          .in('id', contactIds);
        if (contactsError) throw new Error(contactsError.message);

        const byList = new Map<string, string[]>();
        for (const row of contactRows || []) {
          if (!row.list_id) continue;
          const arr = byList.get(row.list_id) ?? [];
          arr.push(row.id);
          byList.set(row.list_id, arr);
        }
        if (byList.size === 0) {
          return { success: false, message: 'Não consegui identificar a lista desses leads.' };
        }

        // Cada grupo de lista vira uma campanha de verdade — consome cota mensal de
        // campanhas igual a um disparo normal (mesma checagem de confirm_campaign),
        // pra não virar um jeito de burlar o limite do plano.
        const planId = await getUserPlanId(userId);
        const availability = await QuotaService.checkAvailability(userId, planId, byList.size);
        if (!availability.available) {
          return {
            success: false,
            message: `Esse follow-up precisaria de ${byList.size} campanha(s), mas você só tem ${availability.remaining} disponível(is) este mês (limite: ${availability.limit}).`,
          };
        }

        let createdCount = 0;
        for (const [listId, selectedIds] of byList) {
          const { data: allInList, error: allError } = await supabase
            .from('contacts')
            .select('id')
            .eq('list_id', listId);
          if (allError) throw new Error(allError.message);

          const excludedContactIds = (allInList || []).map(c => c.id).filter(id => !selectedIds.includes(id));

          await campaignService.createCampaign(
            userId,
            `Follow-up - ${new Date().toLocaleDateString('pt-BR')}`,
            [message],
            listId,
            [connected.id],
            scheduledAt,
            5, 30, 60, 'text', undefined, false, 5,
            excludedContactIds
          );
          createdCount += selectedIds.length;
        }

        return {
          success: true,
          message: `Follow-up criado pra ${createdCount} lead(s)! Vou avisar por aqui conforme for enviando.`,
          result: { redirect: '/dashboard/campaigns' },
        };
      } catch (error: any) {
        console.error(`[AgentService] create_followup error for user ${userId}:`, error.message);
        return { success: false, message: `Não consegui criar o follow-up: ${error.message}` };
      }
    }

    case 'suggest_followup': {
      return {
        success: true,
        message: 'Vamos criar um follow-up! É só me contar pra qual lista e o que você quer mandar.',
        result: {
          redirect: '/dashboard/campaigns',
          action: 'open_followup_modal',
          data: data || {},
        },
      };
    }

    case 'confirm_campaign': {
      const sessionId = data?.sessionId;
      if (!sessionId) {
        return { success: false, message: 'Não encontrei a sessão desse disparo. Pode tentar de novo?' };
      }

      const draft = await loadDraft(userId, sessionId);
      if (!draft || !draft.contactListId || !draft.instanceId || !draft.messageVariations?.length) {
        return {
          success: false,
          message: 'Ainda faltam informações pra eu conseguir disparar — vamos terminar de configurar primeiro.',
        };
      }
      if (!draft.timingConfirmed) {
        return {
          success: false,
          message: 'Antes de disparar, confirme o tempo entre mensagens e o tamanho dos lotes no seletor.',
        };
      }

      try {
        const planId = await getUserPlanId(userId);

        const availability = await QuotaService.checkAvailability(userId, planId, 1);
        if (!availability.available) {
          return {
            success: false,
            message: `Você já usou todas as suas campanhas deste mês (limite: ${availability.limit}). Considere fazer upgrade para disparos liberados.`,
          };
        }

        const instanceIds = draft.instanceIds && draft.instanceIds.length > 0
          ? draft.instanceIds
          : [draft.instanceId as string];

        const campaign = await campaignService.createCampaign(
          userId,
          draft.name || `Disparo - ${draft.contactListName || 'Leads'}`,
          draft.messageVariations,
          draft.contactListId,
          instanceIds,
          draft.scheduledAt || undefined,
          draft.delaySeconds ?? 5,
          draft.batchSize ?? 30,
          draft.batchDelaySeconds ?? 60,
          draft.mediaType || (draft.mediaUrl ? 'image' : 'text'),
          draft.mediaUrl || undefined,
          draft.sequentialMode ?? false,
          draft.blockDelay ?? 5,
          draft.excludedContactIds ?? []
        );

        await saveDraft(userId, sessionId, null);

        return {
          success: true,
          message: `🚀 Disparo "${campaign.name}" criado! Vou te avisar por aqui conforme for enviando.`,
          result: { redirect: `/dashboard/campaigns/${campaign.id}/kanban` },
        };
      } catch (error: any) {
        console.error(`[AgentService] confirm_campaign error for user ${userId}:`, error.message);
        return {
          success: false,
          message: `Não consegui criar o disparo: ${error.message}`,
        };
      }
    }

    default:
      return {
        success: false,
        message: `Ação "${actionType}" não reconhecida.`,
      };
  }
}
