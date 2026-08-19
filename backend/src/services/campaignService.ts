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

    return data;
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
    inCooldown: boolean; // < 24h desde a primeira conexão — orientação é não usar ainda
}

export const getWarmupInfo = async (
    userId: string,
    instanceId: string,
    connectedAt: string | null
): Promise<WarmupInfo> => {
    const { sentLast24h } = await getInstanceSendVolume(userId, instanceId);

    if (!connectedAt) {
        return { daysSinceConnected: null, recommendedDailyLimit: null, sentLast24h, inCooldown: false };
    }

    const daysSinceConnected = (Date.now() - new Date(connectedAt).getTime()) / (24 * 60 * 60 * 1000);
    const stage = WARMUP_SCHEDULE.find(s => daysSinceConnected < s.maxDays);
    const recommendedDailyLimit = stage ? stage.recommendedDailyLimit : null;

    return {
        daysSinceConnected: Math.floor(daysSinceConnected),
        recommendedDailyLimit,
        sentLast24h,
        inCooldown: daysSinceConnected < 1,
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
