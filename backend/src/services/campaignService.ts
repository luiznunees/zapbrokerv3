import { supabase } from '../config/supabase';

export const createCampaign = async (
    userId: string,
    name: string,
    messageVariations: string[],
    contactListId: string,
    instanceIds: string[],
    scheduledAt?: string,
    delaySeconds: number = 5,
    batchSize: number = 30,
    batchDelaySeconds: number = 60,
    mediaType: string = 'text',
    mediaUrl?: string,
    sequentialMode: boolean = false,
    blockDelay: number = 5,
    excludedContactIds: string[] = []
) => {
    // O mesmo número pode chegar repetido (ex: agente resolvendo "WhatsApp" e "WhatsApp 2"
    // pro mesmo registro) — sem deduplicar, a checagem de posse abaixo compara 1 linha
    // encontrada com 2 IDs pedidos e falha com "não foram encontrados ou não pertencem a você".
    instanceIds = [...new Set((instanceIds || []).filter(Boolean))];
    if (!instanceIds || instanceIds.length === 0) throw new Error('Selecione ao menos um WhatsApp pro disparo.');

    // 0. Verify Ownership of List and Instances
    const { data: list } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('id', contactListId)
        .eq('user_id', userId)
        .single();

    if (!list) throw new Error('Contact list not found or access denied');

    const { data: ownedInstances } = await supabase
        .from('instances')
        .select('id')
        .eq('user_id', userId)
        .in('id', instanceIds);

    if (!ownedInstances || ownedInstances.length !== instanceIds.length) {
        throw new Error('Um ou mais WhatsApps selecionados não foram encontrados ou não pertencem a você.');
    }

    // 1. Fetch Contacts Count
    // If we have exclusions, we need to be careful. The "count" from DB is total.
    // Ideally, we should fetch IDs and filter if there are exclusions, BUT for large lists that's heavy.
    // However, since we need to fetch all contacts later anyway to create messages, the Quota Service check 
    // at this stage is a preliminary check. 

    // Let's refine:
    let totalContacts = 0;

    if (excludedContactIds && excludedContactIds.length > 0) {
        // If exclusions exist, we might as well fetch all IDs now to get accurate count
        const { data: allIds, error: countError } = await supabase
            .from('contacts')
            .select('id')
            .eq('list_id', contactListId);

        if (countError) throw new Error(countError.message);

        // Filter
        const validIds = allIds.filter(c => !excludedContactIds.includes(c.id));
        totalContacts = validIds.length;
    } else {
        // Fast path: Just get count
        const { count, error: countError } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', contactListId);

        if (countError) throw new Error(countError.message);
        totalContacts = count || 0;
    }

    if (totalContacts === 0) throw new Error('A lista de contatos selecionada está vazia (ou todos os contatos foram excluídos).');

    // Bloqueio de verdade pra combinação extrema de risco — checado aqui (não só no chat
    // do agente) pra cobrir também o "Disparo rápido" manual, que chama createCampaign
    // direto sem passar pelo agentService. Sem exceção, sem flag de "confirma mesmo assim".
    const antiban = await checkAntiBanSeverity(userId, totalContacts, instanceIds);
    if (antiban.severity === 'extreme') {
        throw new Error('Esse disparo não pode ser confirmado — o número está numa combinação de risco extremo de bloqueio (chip muito novo ou volume muito acima do recomendado). Reduza a lista, espere o aquecimento avançar, ou divida o envio entre mais números conectados.');
    }

    // A checagem/consumo de cota (1 campanha, não por contato) já acontece em
    // checkQuota (middleware) + campaignController.create — não duplicar aqui.

    // 4. Create Campaign (store first variation as message for backward compatibility)
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
            user_id: userId,
            name,
            message: messageVariations[0], // First variation for backward compatibility
            message_variations: messageVariations, // Store all variations
            sequential_mode: sequentialMode,
            block_delay: blockDelay,
            contact_list_id: contactListId,
            instance_id: instanceIds[0], // mantido por compatibilidade — a fonte de verdade pra múltiplos números é campaign_instances
            scheduled_at: scheduledAt || null,
            delay_seconds: delaySeconds,
            batch_size: batchSize,
            batch_delay_seconds: batchDelaySeconds,
            media_type: mediaType,
            media_url: mediaUrl,
            status: 'PENDING'
        }])
        .select()
        .single();

    if (campaignError) {
        throw new Error(campaignError.message);
    }

    // 5b. Associa todos os números escolhidos ao disparo (base do round-robin no processor)
    const { error: instancesLinkError } = await supabase
        .from('campaign_instances')
        .insert(instanceIds.map((id, position) => ({ campaign_id: campaign.id, instance_id: id, position })));

    if (instancesLinkError) {
        throw new Error(instancesLinkError.message);
    }

    // 6. Fetch Contacts
    const { data: allContacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, phone')
        .eq('list_id', contactListId);

    if (contactsError) {
        throw new Error(contactsError.message);
    }

    // Filter out excluded contacts
    const contacts = (excludedContactIds && excludedContactIds.length > 0)
        ? allContacts.filter(c => !excludedContactIds.includes(c.id))
        : allContacts;

    // 7. Create Messages
    const messages = contacts.map(contact => ({
        campaign_id: campaign.id,
        contact_id: contact.id,
        status: 'PENDING'
    }));

    const { error: messagesError } = await supabase
        .from('campaign_messages')
        .insert(messages);

    if (messagesError) {
        throw new Error(messagesError.message);
    }

    return campaign;
};

export const getCampaigns = async (userId: string) => {
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    if (!data || data.length === 0) return [];

    // O status da campanha em si só assume PENDING/PAUSED/CANCELLED (nunca
    // COMPLETED/RUNNING/FAILED) — quem sabe se o disparo já terminou de
    // enviar é a contagem de mensagens, não esse campo. Sem isso, o
    // histórico mostra "Pendente" pra sempre, mesmo já 100% enviado.
    const campaignIds = data.map(c => c.id);
    const { data: messages, error: messagesError } = await supabase
        .from('campaign_messages')
        .select('campaign_id, status')
        .in('campaign_id', campaignIds);

    if (messagesError) throw new Error(messagesError.message);

    return data.map(campaign => {
        const campaignMessages = (messages || []).filter(m => m.campaign_id === campaign.id);
        const total = campaignMessages.length;
        const sent = campaignMessages.filter(m => m.status === 'SENT').length;
        const failed = campaignMessages.filter(m => m.status === 'FAILED').length;
        const pending = total - sent - failed;
        return { ...campaign, messageCounts: { total, sent, failed, pending } };
    });
};

export const getCampaignsSummary = async (userId: string, limit: number = 5) => {
    const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, name, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (campaignsError) throw new Error(campaignsError.message);
    if (!campaigns || campaigns.length === 0) return [];

    const campaignIds = campaigns.map(c => c.id);

    const { data: messages, error: messagesError } = await supabase
        .from('campaign_messages')
        .select('campaign_id, lead_status')
        .in('campaign_id', campaignIds);

    if (messagesError) throw new Error(messagesError.message);

    return campaigns.map(campaign => {
        const campaignMessages = (messages || []).filter(m => m.campaign_id === campaign.id);
        const total = campaignMessages.length;
        const sent = campaignMessages.filter(m => m.lead_status && m.lead_status !== 'PENDING').length;
        const read = campaignMessages.filter(m => ['READ', 'REPLIED', 'NEGOTIATION', 'CONVERTED', 'LOST'].includes(m.lead_status)).length;
        const replied = campaignMessages.filter(m => ['REPLIED', 'NEGOTIATION', 'CONVERTED'].includes(m.lead_status)).length;

        return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            createdAt: campaign.created_at,
            total,
            sent,
            read,
            replied,
        };
    });
};

export const getPerformanceStats = async (userId: string) => {
    const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, name, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (campaignsError) throw new Error(campaignsError.message);
    if (!campaigns || campaigns.length === 0) {
        return { campaignCount: 0, avgReplyRatePct: 0, avgReadRatePct: 0, best: null as any, worst: null as any, campaigns: [] as any[] };
    }

    const campaignIds = campaigns.map(c => c.id);

    const { data: messages, error: messagesError } = await supabase
        .from('campaign_messages')
        .select('campaign_id, lead_status')
        .in('campaign_id', campaignIds);

    if (messagesError) throw new Error(messagesError.message);

    const stats = campaigns.map(campaign => {
        const campaignMessages = (messages || []).filter(m => m.campaign_id === campaign.id);
        const total = campaignMessages.length;
        const sent = campaignMessages.filter(m => m.lead_status && m.lead_status !== 'PENDING').length;
        const read = campaignMessages.filter(m => ['READ', 'REPLIED', 'NEGOTIATION', 'CONVERTED', 'LOST'].includes(m.lead_status)).length;
        const replied = campaignMessages.filter(m => ['REPLIED', 'NEGOTIATION', 'CONVERTED'].includes(m.lead_status)).length;
        const replyRatePct = sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0;
        const readRatePct = sent > 0 ? Math.round((read / sent) * 1000) / 10 : 0;

        return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            createdAt: campaign.created_at,
            total,
            sent,
            read,
            replied,
            replyRatePct,
            readRatePct,
        };
    });

    const withSends = stats.filter(s => s.sent > 0);
    const avgReplyRatePct = withSends.length > 0
        ? Math.round((withSends.reduce((acc, s) => acc + s.replyRatePct, 0) / withSends.length) * 10) / 10
        : 0;
    const avgReadRatePct = withSends.length > 0
        ? Math.round((withSends.reduce((acc, s) => acc + s.readRatePct, 0) / withSends.length) * 10) / 10
        : 0;
    const best = withSends.length > 0 ? withSends.reduce((a, b) => (b.replyRatePct > a.replyRatePct ? b : a)) : null;
    const worst = withSends.length > 0 ? withSends.reduce((a, b) => (b.replyRatePct < a.replyRatePct ? b : a)) : null;

    return { campaignCount: campaigns.length, avgReplyRatePct, avgReadRatePct, best, worst, campaigns: stats };
};

export const getStalledLeadsCount = async (userId: string, days: number = 3) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { count, error } = await supabase
        .from('campaign_messages')
        .select('*, campaigns!inner(user_id)', { count: 'exact', head: true })
        .eq('campaigns.user_id', userId)
        .not('lead_status', 'in', '(REPLIED,CONVERTED,LOST)')
        .lt('updated_at', cutoff.toISOString());

    if (error) throw new Error(error.message);
    return count || 0;
};

export const getKanbanBoard = async (userId: string, campaignId: string) => {
    // Verify campaign ownership
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

    if (!campaign) throw new Error('Campaign not found or access denied');

    // Fetch all messages for this campaign with contact details
    const { data, error } = await supabase
        .from('campaign_messages')
        .select(`
            id,
            lead_status,
            status,
            updated_at,
            contacts (
                id,
                name,
                phone
            )
        `)
        .eq('campaign_id', campaignId);

    if (error) {
        throw new Error(error.message);
    }

    // Group by lead_status
    const columns: any = {
        'PENDING': [],
        'SENT': [],
        'READ': [],
        'REPLIED': [],
        'NEGOTIATION': [],
        'CONVERTED': [],
        'LOST': []
    };

    data.forEach((msg: any) => {
        const status = msg.lead_status || 'PENDING';
        if (columns[status]) {
            columns[status].push({
                id: msg.id,
                contact: msg.contacts,
                status: msg.status, // Technical status
                updatedAt: msg.updated_at
            });
        }
    });

    return columns;
};

export const updateLeadStatus = async (userId: string, messageId: string, newStatus: string) => {
    // Verify ownership via campaign
    const { data: message } = await supabase
        .from('campaign_messages')
        .select('id, campaigns!inner(user_id)')
        .eq('id', messageId)
        .eq('campaigns.user_id', userId)
        .single();

    if (!message) throw new Error('Message not found or access denied');

    const { data, error } = await supabase
        .from('campaign_messages')
        .update({ lead_status: newStatus })
        .eq('id', messageId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};
export const getCampaignDetails = async (userId: string, campaignId: string) => {
    // 1. Fetch Campaign Info (with ownership check)
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

    if (campaignError) {
        throw new Error(campaignError.message || 'Campaign not found or access denied');
    }

    // 2. Fetch Messages with Contact Info
    const { data: messages, error: messagesError } = await supabase
        .from('campaign_messages')
        .select(`
            id,
            status,
            error_message,
            updated_at,
            lead_status,
            contacts (
                id,
                name,
                phone
            )
        `)
        .eq('campaign_id', campaignId);

    if (messagesError) {
        throw new Error(messagesError.message);
    }

    return {
        ...campaign,
        messages: messages || []
    };
};
// Busca a campanha mais recente do usuário cujo nome contenha o termo (case-insensitive).
export const findCampaignByName = async (userId: string, nameQuery: string) => {
    const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status, scheduled_at, contact_list_id, instance_id, message_variations, media_type, media_url, delay_seconds, sequential_mode, block_delay')
        .eq('user_id', userId)
        .ilike('name', `%${nameQuery}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
};

// Cancela um disparo que ainda não rodou (PENDING) e devolve a cota consumida por ele.
export const cancelScheduledCampaign = async (userId: string, campaignId: string) => {
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

    if (!campaign) throw new Error('Campaign not found or access denied');
    if (campaign.status !== 'PENDING' && campaign.status !== 'PAUSED') {
        throw new Error('Só é possível cancelar campanhas que ainda não começaram a enviar.');
    }

    const { data, error } = await supabase
        .from('campaigns')
        .update({ status: 'CANCELLED' })
        .eq('id', campaignId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

// Heurística simples de risco de bloqueio: quantas mensagens esse número já
// processou (enviadas/lidas/etc) nas últimas 24h, através de todas as campanhas dele.
export const getInstanceSendVolume = async (userId: string, instanceId: string, hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Duas fontes: campanhas antigas de número único (campaigns.instance_id) e campanhas
    // (novas ou de múltiplos números) linkadas via campaign_instances — união pra não
    // subcontar o volume de um número usado em disparo dividido.
    const [{ data: legacyCampaigns, error: legacyError }, { data: linkedCampaigns, error: linkedError }] = await Promise.all([
        supabase.from('campaigns').select('id').eq('user_id', userId).eq('instance_id', instanceId),
        supabase.from('campaign_instances').select('campaign_id').eq('instance_id', instanceId),
    ]);

    if (legacyError) throw new Error(legacyError.message);
    if (linkedError) throw new Error(linkedError.message);

    const campaignIds = Array.from(new Set([
        ...(legacyCampaigns || []).map(c => c.id),
        ...(linkedCampaigns || []).map(c => c.campaign_id),
    ]));
    if (campaignIds.length === 0) return { sentLast24h: 0 };

    const { count, error } = await supabase
        .from('campaign_messages')
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', campaignIds)
        .neq('status', 'PENDING')
        .gte('updated_at', cutoff);

    if (error) throw new Error(error.message);
    return { sentLast24h: count || 0 };
};

// Rampa de aquecimento — quanto mais novo o número, menor o volume diário recomendado.
// Baseado em orientações reais de fornecedores de chip aquecido: dia 1 descansa, sobe
// gradualmente até liberar em ~2 semanas. 200/dia é usado como "capacidade cheia" de
// referência (mesmo teto que getInstanceSendVolume/check_instance_rate_limit já tratam
// como risco alto).
const WARMUP_SCHEDULE: Array<{ maxDays: number; recommendedDailyLimit: number | null }> = [
    { maxDays: 1, recommendedDailyLimit: 0 },
    { maxDays: 2, recommendedDailyLimit: 40 },
    { maxDays: 3, recommendedDailyLimit: 70 },
    { maxDays: 7, recommendedDailyLimit: 120 },
    { maxDays: 14, recommendedDailyLimit: 200 },
];

export interface WarmupInfo {
    daysSinceConnected: number | null;
    recommendedDailyLimit: number | null; // null = sem teto de aquecimento (chip já maduro)
    sentLast24h: number;
    inCooldown: boolean; // < 24h de aquecimento — orientação é não usar ainda
    basis: 'chip' | 'connection'; // de onde veio a idade: o que o usuário informou sobre o chip, ou (fallback) a data de conexão no ZapBroker
}

// A idade real do chip no WhatsApp (quanto tempo ele já tem uso de verdade) é o que
// determina o risco de bloqueio — não a data em que ele foi conectado aqui no ZapBroker.
// Um chip já maduro pode ser conectado hoje e não corre o mesmo risco de um número
// realmente novo; por isso, quando o usuário informou a idade do chip ao conectar
// (instances.self_reported_chip_days), essa é a base. connected_at só entra como
// fallback pra quem não informou.
export const getWarmupInfo = async (
    userId: string,
    instanceId: string,
    connectedAt: string | null,
    selfReportedChipDays?: number | null
): Promise<WarmupInfo> => {
    const { sentLast24h } = await getInstanceSendVolume(userId, instanceId);

    let daysSinceConnected: number | null = null;
    let basis: 'chip' | 'connection' = 'connection';

    if (selfReportedChipDays !== undefined && selfReportedChipDays !== null) {
        daysSinceConnected = selfReportedChipDays;
        basis = 'chip';
    } else if (connectedAt) {
        daysSinceConnected = (Date.now() - new Date(connectedAt).getTime()) / (24 * 60 * 60 * 1000);
    }

    if (daysSinceConnected === null) {
        return { daysSinceConnected: null, recommendedDailyLimit: null, sentLast24h, inCooldown: false, basis };
    }

    const stage = WARMUP_SCHEDULE.find(s => daysSinceConnected! < s.maxDays);
    const recommendedDailyLimit = stage ? stage.recommendedDailyLimit : null;

    return {
        daysSinceConnected: Math.floor(daysSinceConnected),
        recommendedDailyLimit,
        sentLast24h,
        inCooldown: daysSinceConnected < 1,
        basis,
    };
};

// Acima disso, disparar pra uma lista grande usando um único número aumenta bastante o
// risco de bloqueio do WhatsApp — vale um aviso explícito, não só uma sugestão em texto.
export const ANTIBAN_LEAD_THRESHOLD = 300;

// Combinação extrema (bloqueia de verdade, não é só aviso): chip em cooldown total (dia 0,
// limite recomendado da rampa = 0) disparando pra mais que isso, ou volume passando esse
// múltiplo do teto diário recomendado pro estágio de aquecimento atual.
export const ANTIBAN_EXTREME_COOLDOWN_LEADS = 50;
export const ANTIBAN_EXTREME_WARMUP_MULTIPLIER = 3;

export interface AntiBanCheck {
    reasons: Array<'volume' | 'cooldown' | 'warmup_limit'>;
    severity: 'moderate' | 'extreme' | undefined;
    warmup?: WarmupInfo;
}

// Único lugar que calcula risco de bloqueio — usado tanto pelo agente de chat
// (agentService.recomputeDraftMeta, pro aviso) quanto direto dentro de createCampaign
// abaixo (pro bloqueio de verdade), pra nenhum caminho de criar campanha escapar da
// checagem — inclusive o "Disparo rápido" manual, que não passa pelo agente.
export const checkAntiBanSeverity = async (
    userId: string,
    leadCount: number,
    instanceIds: string[]
): Promise<AntiBanCheck> => {
    const uniqueIds = [...new Set((instanceIds || []).filter(Boolean))];
    const usingSingleInstance = uniqueIds.length <= 1;
    const reasons = new Set<'volume' | 'cooldown' | 'warmup_limit'>();
    let severity: 'moderate' | 'extreme' | undefined;
    let warmup: WarmupInfo | undefined;
    let warmupRank = -1;

    if (leadCount > ANTIBAN_LEAD_THRESHOLD && usingSingleInstance) {
        reasons.add('volume');
    }

    // Aquecimento é checado em CADA número, com a fatia de leads que cabe a ele. Dividir
    // entre vários números reduz o volume por número, mas não tira nenhum deles do
    // aquecimento — achado real (Fernanda, 25/09): 304 leads divididos entre 2 chips
    // conectados no mesmo dia passavam sem aviso nenhum, porque com 2+ números essa
    // checagem era pulada inteira (152 por chip em cooldown = combinação extrema).
    const leadsPerInstance = Math.ceil(leadCount / Math.max(uniqueIds.length, 1));
    for (const instanceId of uniqueIds) {
        const { data: instanceRow } = await supabase
            .from('instances')
            .select('connected_at, self_reported_chip_days')
            .eq('id', instanceId)
            .single();
        const info = await getWarmupInfo(userId, instanceId, instanceRow?.connected_at ?? null, instanceRow?.self_reported_chip_days ?? null);

        let flagged = false;
        if (info.inCooldown) {
            reasons.add('cooldown');
            flagged = true;
        } else if (info.recommendedDailyLimit !== null && info.sentLast24h + leadsPerInstance > info.recommendedDailyLimit) {
            reasons.add('warmup_limit');
            flagged = true;
        }

        const extreme =
            (info.inCooldown && leadsPerInstance > ANTIBAN_EXTREME_COOLDOWN_LEADS) ||
            (info.recommendedDailyLimit !== null && info.recommendedDailyLimit > 0 && info.sentLast24h + leadsPerInstance > info.recommendedDailyLimit * ANTIBAN_EXTREME_WARMUP_MULTIPLIER);

        // O warmup devolvido (texto do aviso) é o do número mais arriscado: extremo > sinalizado > qualquer.
        const rank = extreme ? 2 : flagged ? 1 : 0;
        if (!warmup || rank > warmupRank) {
            warmup = info;
            warmupRank = rank;
        }
        if (extreme) severity = 'extreme';
    }

    if (reasons.size > 0 && severity !== 'extreme') severity = 'moderate';

    return { reasons: [...reasons], severity, warmup };
};

// Statuses de lead_status que indicam que o contato respondeu em algum momento — LOST fica
// de fora de propósito (pode acontecer sem nunca ter respondido, então contar como
// "resposta" infla a taxa artificialmente).
const REPLIED_LEAD_STATUSES = new Set(['REPLIED', 'NEGOTIATION', 'CONVERTED']);

// Mesma aproximação de getInstanceSendVolume: campaign_messages não guarda qual instância
// específica enviou/recebeu cada mensagem quando o disparo é dividido entre vários números
// (campaign_instances só registra o pool, não o remetente real por mensagem) — então, pra
// campanha multi-instância, a taxa aqui é "desse pool", não garantidamente só desse número.
// Também usa updated_at como proxy de data (a tabela não tem created_at) — impreciso, mas é
// o que existe.
export const getInstanceReplyRate = async (userId: string, instanceId: string, days: number = 30) => {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: legacyCampaigns, error: legacyError }, { data: linkedCampaigns, error: linkedError }] = await Promise.all([
        supabase.from('campaigns').select('id').eq('user_id', userId).eq('instance_id', instanceId),
        supabase.from('campaign_instances').select('campaign_id').eq('instance_id', instanceId),
    ]);

    if (legacyError) throw new Error(legacyError.message);
    if (linkedError) throw new Error(linkedError.message);

    const campaignIds = Array.from(new Set([
        ...(legacyCampaigns || []).map(c => c.id),
        ...(linkedCampaigns || []).map(c => c.campaign_id),
    ]));
    if (campaignIds.length === 0) return { sentCount: 0, repliedCount: 0, replyRatePct: null as number | null };

    const { data: messages, error } = await supabase
        .from('campaign_messages')
        .select('lead_status')
        .in('campaign_id', campaignIds)
        .neq('status', 'PENDING')
        .gte('updated_at', cutoff);

    if (error) throw new Error(error.message);

    const sentCount = messages?.length || 0;
    if (sentCount === 0) return { sentCount: 0, repliedCount: 0, replyRatePct: null as number | null };

    const repliedCount = (messages || []).filter(m => REPLIED_LEAD_STATUSES.has(m.lead_status)).length;
    const replyRatePct = Math.round((repliedCount / sentCount) * 1000) / 10;

    return { sentCount, repliedCount, replyRatePct };
};

export interface InstanceHealth {
    warmup: WarmupInfo;
    replyRatePct: number | null;
    repliedCount: number;
    sentCount: number;
    level: 'boa' | 'atencao' | 'risco';
}

// Taxa de resposta muito baixa é um dos sinais que a comunidade associa a risco de
// detecção de spam (ver pesquisa antiban) — usado aqui só como alerta precoce pro corretor
// revisar a lista/abordagem, nunca como certeza de bloqueio iminente.
const LOW_REPLY_RATE_PCT = 5;
const MIN_SENT_FOR_REPLY_SIGNAL = 10; // amostra pequena demais não deve gerar alarme

// Combina aquecimento + taxa de resposta recente num nível único pra mostrar na tela de
// conexão — visibilidade contínua, não só o aviso que hoje só aparece na hora de montar
// o disparo.
export const getInstanceHealth = async (
    userId: string,
    instanceId: string,
    connectedAt: string | null,
    selfReportedChipDays?: number | null
): Promise<InstanceHealth> => {
    const [warmup, reply] = await Promise.all([
        getWarmupInfo(userId, instanceId, connectedAt, selfReportedChipDays),
        getInstanceReplyRate(userId, instanceId),
    ]);

    const overWarmupLimit = warmup.recommendedDailyLimit !== null && warmup.sentLast24h > warmup.recommendedDailyLimit;
    const lowReplySignal = reply.sentCount >= MIN_SENT_FOR_REPLY_SIGNAL && reply.replyRatePct !== null && reply.replyRatePct < LOW_REPLY_RATE_PCT;

    let level: 'boa' | 'atencao' | 'risco' = 'boa';
    if (warmup.inCooldown || overWarmupLimit || lowReplySignal) {
        level = 'risco';
    } else if (warmup.recommendedDailyLimit !== null) {
        level = 'atencao'; // ainda dentro da rampa de aquecimento, sem estourar nada
    }

    return {
        warmup,
        replyRatePct: reply.replyRatePct,
        repliedCount: reply.repliedCount,
        sentCount: reply.sentCount,
        level,
    };
};

export const pauseCampaign = async (userId: string, campaignId: string) => {
    // Check ownership
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

    if (!campaign) throw new Error('Campaign not found or access denied');

    // Update status
    const { data, error } = await supabase
        .from('campaigns')
        .update({ status: 'PAUSED' })
        .eq('id', campaignId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const resumeCampaign = async (userId: string, campaignId: string) => {
    // Check ownership
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

    if (!campaign) throw new Error('Campaign not found or access denied');

    // Update status -> PENDING will be picked up by processor
    // Or RUNNING if you prefer, but PENDING is safer for the processor logic
    const { data, error } = await supabase
        .from('campaigns')
        .update({ status: 'PENDING' })
        .eq('id', campaignId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};
