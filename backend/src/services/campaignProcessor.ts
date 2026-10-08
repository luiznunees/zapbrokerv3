import { supabase } from '../config/supabase';
import { campaignQueue } from '../queues/campaignQueue';
import { getInstanceSendVolume, getCampaignSentToday } from './campaignService';
import { isInsideWindow, sendWindowFromCampaignRow } from '../utils/sendWindow';

const BATCH_SIZE = 50; // Can process more now as we just enqueue
const INTERVAL_MS = 5000; // Check every 5 seconds

let isProcessing = false;
let processorTimer: NodeJS.Timeout | null = null;

export const startProcessor = () => {
    console.log('Starting Campaign Processor (Queue Mode)...');
    processorTimer = setInterval(processQueue, INTERVAL_MS);
};

// Desligamento controlado (deploy): para de enfileirar e espera o ciclo em andamento acabar.
export const stopProcessor = async () => {
    if (processorTimer) clearInterval(processorTimer);
    processorTimer = null;
    for (let i = 0; i < 50 && isProcessing; i++) {
        await new Promise((r) => setTimeout(r, 100));
    }
};

const processQueue = async () => {
    // console.log('[CampaignProcessor] Heartbeat...');
    if (isProcessing) return;
    isProcessing = true;

    try {
        // Mensagem presa em SENDING (processo morreu no meio do envio e o job se perdeu): não
        // reenvia — parte pode ter chegado ao lead. Marca como falha pra aparecer no painel.
        await supabase
            .from('campaign_messages')
            .update({
                status: 'FAILED',
                error_message: 'Envio interrompido no meio (reinício do servidor) — parte da mensagem pode ter chegado ao lead.',
                updated_at: new Date().toISOString(),
            })
            .eq('status', 'SENDING')
            .lt('updated_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

        // Rede de segurança: mensagens que ficaram em QUEUED por muito tempo sem progredir
        // (worker reiniciado/travado no meio do job) voltam pra PENDING pra serem
        // reenfileiradas — sem isso, uma falha silenciosa deixava a campanha presa pra sempre
        // (achado real em produção — ver relatório /relatorio-agente). Com o timeout novo em
        // evolutionService.ts isso deve virar FAILED sozinho na maioria dos casos; isso aqui
        // cobre o resto (crash do processo, por exemplo).
        //
        // 15min, não 3min: um ciclo normal de 3 tentativas já leva bem mais que 3min sozinho
        // (jitter anti-ban de ~60-78s + digitação simulada por tentativa, x3, mais backoff) —
        // um cutoff curto pegava mensagens que ainda estavam sendo processadas de verdade e
        // criava um job duplicado pra elas (achado real em produção: mesma mensagem gerou 2
        // eventos campaign.message_failed, ~4min de diferença, exatamente esse mecanismo). Se
        // fosse um envio bem-sucedido em vez de falho, isso arriscava mandar a mesma mensagem
        // duas vezes pro lead.
        //
        // Numa campanha grande a mensagem espera HORAS em QUEUED de forma legítima (304 leads a
        // ~2,5min cada). Reenfileirar isso duplicava jobs a cada 15min (achado real, Fernanda
        // 25/09). Agora é seguro: o job usa o id da mensagem como jobId (BullMQ ignora add de
        // um job que ainda está na fila) e o worker só envia se a mensagem ainda não saiu.
        const stuckCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data: requeued } = await supabase
            .from('campaign_messages')
            .update({ status: 'PENDING', updated_at: new Date().toISOString() })
            .eq('status', 'QUEUED')
            .lt('updated_at', stuckCutoff)
            .select('id');
        if (requeued && requeued.length > 0) {
            console.warn(`[CampaignProcessor] ${requeued.length} mensagem(ns) travada(s) em QUEUED por mais de 15min — revertidas pra PENDING.`);
        }

        const validMessages = await fetchSendableMessages();
        if (!validMessages || validMessages.length === 0) {
            isProcessing = false;
            return;
        }

        console.log(`[CampaignProcessor] Found ${validMessages.length} active messages dentro da janela de envio. Enqueuing...`);

        // Mark as QUEUED immediately — reserva atômica: só enfileira o que ESTE processo
        // conseguiu virar de PENDING pra QUEUED. Durante um deploy sem downtime dois processos
        // rodam juntos por alguns segundos; sem isso os dois pegavam as mesmas mensagens.
        const messageIds = validMessages.map(m => m.id);
        const { data: claimedRows } = await supabase
            .from('campaign_messages')
            .update({ status: 'QUEUED', updated_at: new Date().toISOString() })
            .in('id', messageIds)
            .eq('status', 'PENDING')
            .select('id');
        const claimedIds = new Set((claimedRows || []).map((r: any) => r.id));
        const toEnqueue = validMessages.filter(m => claimedIds.has(m.id));
        if (toEnqueue.length === 0) return;

        const campaignIdsInBatch = Array.from(new Set(toEnqueue.map(m => (m.campaigns as any).id)));
        const roundRobin = await buildRoundRobinPicker(campaignIdsInBatch);

        for (const msg of toEnqueue) {
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
                // jobId = id da mensagem: se já existe um job dela esperando na fila, o BullMQ
                // ignora esse add — nunca duas cópias da mesma mensagem na fila.
                jobId: msg.id,
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

// Campanhas fora da janela de envio (ou com o teto do dia batido) ficam de fora da busca até
// esse horário — sem isso, as PENDING delas ocupavam o lote inteiro a cada volta e o disparo
// de outro cliente, que podia sair agora, nunca era buscado.
const windowBlockedUntil = new Map<string, number>();
const WINDOW_RECHECK_MS = 60 * 1000;

function campaignsBlockedNow(): string[] {
    const now = Date.now();
    for (const [id, until] of windowBlockedUntil) if (until <= now) windowBlockedUntil.delete(id);
    return [...windowBlockedUntil.keys()];
}

async function fetchPendingBatch(excludeCampaignIds: string[]) {
    let query = supabase
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
                media_type,
                media_url,
                scheduled_at,
                status,
                window_start_minute,
                window_end_minute,
                window_weekdays,
                window_max_per_day
            )
        `)
        .eq('status', 'PENDING')
        .not('campaigns.status', 'eq', 'PAUSED'); // Ensure we don't pick up paused campaigns
    if (excludeCampaignIds.length > 0) {
        query = query.not('campaign_id', 'in', `(${excludeCampaignIds.join(',')})`);
    }
    return query.limit(BATCH_SIZE);
}

// Aplica a janela de envio por campanha: fora do horário/dia não sai nada; com teto diário,
// só enfileira o que ainda cabe hoje (já enviadas hoje + as que já estão na fila contam).
// Devolve as mensagens liberadas e quantas campanhas foram tiradas da busca nessa volta.
async function applySendWindows(messages: any[]): Promise<{ allowed: any[]; newlyBlocked: number }> {
    const byCampaign = new Map<string, any[]>();
    for (const msg of messages) {
        const id = (msg.campaigns as any).id;
        if (!byCampaign.has(id)) byCampaign.set(id, []);
        byCampaign.get(id)!.push(msg);
    }

    const allowed: any[] = [];
    let newlyBlocked = 0;
    const block = (campaignId: string) => {
        windowBlockedUntil.set(campaignId, Date.now() + WINDOW_RECHECK_MS);
        newlyBlocked++;
    };

    for (const [campaignId, msgs] of byCampaign) {
        const window = sendWindowFromCampaignRow(msgs[0].campaigns);
        if (!isInsideWindow(window)) {
            block(campaignId);
            continue;
        }
        if (!window.maxPerDay) {
            allowed.push(...msgs);
            continue;
        }

        const [sentToday, { count: inFlight }] = await Promise.all([
            getCampaignSentToday(campaignId, window),
            supabase
                .from('campaign_messages')
                .select('id', { count: 'exact', head: true })
                .eq('campaign_id', campaignId)
                .in('status', ['QUEUED', 'SENDING']),
        ]);
        const remaining = window.maxPerDay - sentToday - (inFlight || 0);
        if (remaining <= 0) {
            if (sentToday >= window.maxPerDay) {
                console.log(`[CampaignProcessor] Campanha ${campaignId} bateu o teto do dia (${sentToday}/${window.maxPerDay}) — continua amanhã na janela.`);
            }
            block(campaignId);
            continue;
        }
        allowed.push(...msgs.slice(0, remaining));
    }

    return { allowed, newlyBlocked };
}

// Busca PENDING já filtradas pela janela de envio. Se o lote inteiro era de campanhas fora da
// janela, busca de novo sem elas (até 3 vezes) pra não deixar outro disparo esperando 5s à toa.
async function fetchSendableMessages(): Promise<any[] | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
        const { data: messages, error } = await fetchPendingBatch(campaignsBlockedNow());

        if (error) {
            // Suppress full error stack for network failures to avoid spam
            console.warn(`[CampaignProcessor] Failed to fetch queue: ${error.message} (Retrying...)`);
            return null;
        }
        if (!messages || messages.length === 0) return null;

        // Filter out messages where campaign is missing (failed join) or Paused
        const valid = messages.filter(msg => {
            const camp = msg.campaigns as any;
            return camp && camp.status !== 'PAUSED';
        });

        const { allowed, newlyBlocked } = await applySendWindows(valid);
        if (allowed.length > 0 || newlyBlocked === 0) return allowed;
    }
    return null;
}

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
