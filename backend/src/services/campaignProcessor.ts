import { supabase } from '../config/supabase';
import { campaignQueue } from '../queues/campaignQueue';

const BATCH_SIZE = 50; // Can process more now as we just enqueue
const INTERVAL_MS = 10000; // Check every 10 seconds

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
                campaigns ( 
                    id, 
                    message, 
                    instance_id, 
                    delay_seconds, 
                    batch_size, 
                    batch_delay_seconds, 
                    media_type, 
                    media_url,
                    scheduled_at
                )
            `)
            .eq('status', 'PENDING')
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

        console.log(`[CampaignProcessor] Found ${messages.length} PENDING messages. Enqueuing...`);

        // Mark as QUEUED immediately
        const messageIds = messages.map(m => m.id);
        await supabase
            .from('campaign_messages')
            .update({ status: 'QUEUED', updated_at: new Date().toISOString() })
            .in('id', messageIds);

        for (const msg of messages) {
            const campaign = msg.campaigns as any;

            if (!campaign) {
                console.error(`Invalid campaign for message ${msg.id}`);
                continue;
            }

            // Calculate Delay
            const delay = campaign.delay_seconds || 5;

            await campaignQueue.add('dispatch', {
                id: msg.id, // Important: Pass the campaign_message ID
                campaignId: campaign.id,
                contactId: msg.contact_id,
                message: campaign.message,
                instanceId: campaign.instance_id,
                mediaType: campaign.media_type,
                mediaUrl: campaign.media_url,
                delay: delay // Worker will wait this amount
            }, {
                removeOnComplete: true,
                removeOnFail: 500 // Keep failed jobs for inspection
            });
        }

    } catch (error) {
        console.error('Processor error:', error);
    } finally {
        isProcessing = false;
    }
};
