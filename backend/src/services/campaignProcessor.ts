import { supabase } from '../config/supabase';
import { campaignQueue } from '../queues/campaignQueue';
import { getInstanceSendVolume } from './campaignService';

const BATCH_SIZE = 50; // Can process more now as we just enqueue
const INTERVAL_MS = 5000; // Check every 5 seconds

let isProcessing = false;

export const startProcessor = () => {
    console.log('Starting Campaign Processor (Queue Mode)...');
    setInterval(processQueue, INTERVAL_MS);
};

const processQueue = async () => {
    // console.log('[CampaignProcessor] Heartbeat...'); 
    if (isProcessing) return;
    isProcessing = true;

    try {
        // Fetch PENDING messages
        const { data: messages, error } = await supabase
            .from('campaign_messages')
            .select(`
                id,
                contact_id,
                campaign_id,
                campaigns!inner (
                    id,
                    user_id,
                    message,
                    message_variations,
                    sequential_mode,
                    block_delay,
                    instance_id,
                    delay_seconds,
                    batch_size,
                    batch_delay_seconds,
                    media_type,
                    media_url,
                    scheduled_at,
                    status
                )
            `)
            .eq('status', 'PENDING')
            .not('campaigns.status', 'eq', 'PAUSED') // Ensure we don't pick up paused campaigns
            .limit(BATCH_SIZE);

        if (error) {
            // Suppress full error stack for network failures to avoid spam
            console.warn(`[CampaignProcessor] Failed to fetch queue: ${error.message} (Retrying...)`);
            isProcessing = false;
            return;
        }

        if (!messages || messages.length === 0) {
            isProcessing = false;
            return;
        }

        // Filter out messages where campaign is missing (failed join) or Paused
        const validMessages = messages.filter(msg => {
            const camp = msg.campaigns as any;
            return camp && camp.status !== 'PAUSED';
        });

        if (validMessages.length === 0) {
            console.log(`[CampaignProcessor] Fetched ${messages.length} messages, but all were Paused/Invalid. Ignoring.`);
            isProcessing = false;
            return;
        }

        console.log(`[CampaignProcessor] Found ${validMessages.length} active messages (filtered from ${messages.length}). Enqueuing...`);

        // Mark as QUEUED immediately
        const messageIds = validMessages.map(m => m.id);
        await supabase
            .from('campaign_messages')
            .update({ status: 'QUEUED', updated_at: new Date().toISOString() })
            .in('id', messageIds);

        const campaignIdsInBatch = Array.from(new Set(validMessages.map(m => (m.campaigns as any).id)));
        const roundRobin = await buildRoundRobinPicker(campaignIdsInBatch);

        for (const msg of validMessages) {
            const campaign = msg.campaigns as any;

            if (!campaign) {
                console.error(`Invalid campaign for message ${msg.id}`);
                continue;
            }

            // Calculate Delay
            const delay = campaign.delay_seconds || 5;

            // Use message_variations if available, otherwise fall back to message
            const messageVariations = campaign.message_variations || [campaign.message];

            // Disparo dividido entre vários números: escolhe o menos carregado nas últimas
            // 24h pra essa mensagem específica. Campanhas de número único caem no fallback
            // (campaign.instance_id) sem custo extra.
            const instanceId = roundRobin(campaign.id) || campaign.instance_id;

            await campaignQueue.add('dispatch', {
                id: msg.id, // Important: Pass the campaign_message ID
                campaignId: campaign.id,
                contactId: msg.contact_id,
                messageVariations: messageVariations, // Pass all variations
                sequentialMode: campaign.sequential_mode || false,
                blockDelay: campaign.block_delay || 5,
                instanceId,
                mediaType: campaign.media_type,
                mediaUrl: campaign.media_url,
                delay: delay // Worker will wait this amount
            }, {
                removeOnComplete: true,
                removeOnFail: 500, // Keep failed jobs for inspection
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 }
            });
        }

    } catch (error) {
        console.error('Processor error:', error);
    } finally {
        isProcessing = false;
    }
};

// Monta, pra cada campanha do lote atual, uma função que escolhe o número de WhatsApp
// menos carregado (volume das últimas 24h) a cada chamada — balanceando o disparo entre
// os números associados em campaign_instances. Campanhas de número único (sem linha em
// campaign_instances, ou só uma) não passam por isso: o processQueue cai no fallback
// campaign.instance_id, sem custo extra de consulta.
async function buildRoundRobinPicker(campaignIds: string[]): Promise<(campaignId: string) => string | null> {
    const { data: links, error } = await supabase
        .from('campaign_instances')
        .select('campaign_id, instance_id, campaigns!inner(user_id)')
        .in('campaign_id', campaignIds);

    if (error || !links || links.length === 0) {
        return () => null;
    }

    const byCampaign = new Map<string, { userId: string; instanceIds: string[] }>();
    for (const link of links as any[]) {
        const entry: { userId: string; instanceIds: string[] } =
            byCampaign.get(link.campaign_id) || { userId: link.campaigns.user_id, instanceIds: [] as string[] };
        entry.instanceIds.push(link.instance_id);
        byCampaign.set(link.campaign_id, entry);
    }

    // Só vale a pena balancear quando há de fato 2+ números na campanha.
    const multiInstanceCampaigns = [...byCampaign.entries()].filter(([, v]) => v.instanceIds.length > 1);
    if (multiInstanceCampaigns.length === 0) {
        return () => null;
    }

    const counters = new Map<string, Map<string, number>>(); // campaignId -> instanceId -> contador local do lote

    for (const [campaignId, { userId, instanceIds }] of multiInstanceCampaigns) {
        const volumes = await Promise.all(
            instanceIds.map(async id => {
                try {
                    const { sentLast24h } = await getInstanceSendVolume(userId, id);
                    return [id, sentLast24h] as const;
                } catch {
                    return [id, 0] as const;
                }
            })
        );
        counters.set(campaignId, new Map(volumes));
    }

    return (campaignId: string) => {
        const campaignCounters = counters.get(campaignId);
        if (!campaignCounters) return null;

        let chosen: string | null = null;
        let lowest = Infinity;
        for (const [instanceId, count] of campaignCounters) {
            if (count < lowest) {
                lowest = count;
                chosen = instanceId;
            }
        }
        if (chosen) campaignCounters.set(chosen, lowest + 1); // simula o envio pra continuar balanceando dentro do mesmo lote
        return chosen;
    };
}
