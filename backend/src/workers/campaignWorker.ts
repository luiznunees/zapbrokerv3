import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import * as evolutionService from '../services/evolutionService';
import fs from 'fs';
import path from 'path';
import { injectInvisibleMarker } from '../utils/invisibleMarker';

const MIMETYPE_BY_EXTENSION: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
    mp3: 'audio/mpeg', ogg: 'audio/ogg', oga: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4',
};

// Se o arquivo estiver hospedado localmente (uploads/), lê e converte pra base64 puro —
// a Evolution API prefere isso a mandar só a URL. Reaproveitado por imagem/vídeo/áudio.
function readLocalMediaAsBase64(mediaUrl: string, fallbackMimetype: string): { mediaData: string; mimetype: string } {
    let mediaData = mediaUrl;
    let mimetype = fallbackMimetype;

    if (mediaUrl && (mediaUrl.includes('localhost') || mediaUrl.includes('127.0.0.1'))) {
        try {
            const filename = mediaUrl.split('/').pop() as string;
            const filePath = path.join(process.cwd(), 'uploads', filename);

            if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);
                const extension = path.extname(filePath).toLowerCase().replace('.', '');
                mimetype = MIMETYPE_BY_EXTENSION[extension] || fallbackMimetype;
                mediaData = fileBuffer.toString('base64');
            } else {
                console.warn(`[CampaignWorker] Local file not found: ${filePath}`);
            }
        } catch (err: any) {
            console.error('[CampaignWorker] Failed to convert local media to base64:', err.message);
        }
    }

    return { mediaData, mimetype };
}

export const campaignWorker = new Worker('campaign-dispatch', async (job) => {
    const { campaignId, contactId, messageVariations, instanceId, mediaType, mediaUrl, delay, sequentialMode, blockDelay } = job.data;

    // 0. CHECK PAUSE STATUS
    const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('status')
        .eq('id', campaignId)
        .single();

    if (campaignData?.status === 'PAUSED') {
        console.log(`[CampaignWorker] Campaign ${campaignId} is PAUSED. Aborting job ${job.id} and requeuing later.`);
        // Revert message status to PENDING so it gets picked up again when resumed
        await supabase
            .from('campaign_messages')
            .update({ status: 'PENDING' })
            .eq('id', job.data.id); // Use the message ID passed in job

        return; // Exit worker
    }

    console.log(`[CampaignWorker] Processing job ${job.id} for campaign ${campaignId}, contact ${contactId}`);

    // Fetch contact details
    const { data: contact } = await supabase
        .from('contacts')
        .select('phone, name')
        .eq('id', contactId)
        .single();

    if (!contact) {
        throw new Error(`Contact ${contactId} not found`);
    }

    // Format Phone Number
    let phone = contact.phone.replace(/\D/g, ''); // Remove non-digits
    if (phone.length === 10 || phone.length === 11) {
        phone = '55' + phone; // Add Brazil DDI if missing
    }

    // 🕰️ ANTI-BAN: RANDOM DELAY (JITTER)
    // Instead of fixed 5s, we vary it by +/- 30% to look human
    const baseDelay = Number(delay) || 5;
    // Random factor between 0.7 and 1.3
    const jitterFactor = 0.7 + Math.random() * 0.6;
    let finalDelay = Math.floor(baseDelay * jitterFactor);
    if (finalDelay < 2) finalDelay = 2; // Min 2s safety

    console.log(`[CampaignWorker] Anti-Ban Jitter: Base ${baseDelay}s -> Randomized ${finalDelay}s. Waiting...`);
    await new Promise(resolve => setTimeout(resolve, finalDelay * 1000));

    // Send Message
    // NOTE: instanceId here is the Database ID, but Evolution needs the instance Name (evolution_id)
    // We should probably optimize job to carry evolution_id or fetch it.
    // For now, let's assume instanceId PASSED to worker IS the evolution_id (string name)
    // If not, we need a DB lookup. Let's assume the scheduler resolves it.

    // Safety check: if instanceId looks like UUID, fetch name. If it looks like name, use it.
    let targetInstanceName = instanceId;
    if (instanceId.length > 30) { // UUID check approximation
        const { data: inst } = await supabase.from('instances').select('evolution_id').eq('id', instanceId).single();
        if (inst) targetInstanceName = inst.evolution_id;
    }

    // Fetch WhatsApp Name if missing
    let contactName = contact.name || 'Sem Nome';
    if (contactName === 'Sem Nome' || contactName === 'Unknown') {
        console.log(`[CampaignWorker] Name missing for ${phone}. Fetching from WhatsApp...`);
        const profile = await evolutionService.fetchProfile(targetInstanceName, phone);
        if (profile && profile.pushname) {
            contactName = profile.pushname;
            console.log(`[CampaignWorker] Found name: ${contactName}. Updating DB...`);
            await supabase.from('contacts').update({ name: contactName }).eq('id', contactId);
        }
    }

    // 🎲 RANDOM MESSAGE VARIATION SELECTION
    // Select a random variation from the array
    const variations = Array.isArray(messageVariations) ? messageVariations : [messageVariations];
    const randomIndex = Math.floor(Math.random() * variations.length);
    const selectedMessage = variations[randomIndex];

    console.log(`[CampaignWorker] Selected variation ${randomIndex + 1}/${variations.length} for ${contactName}`);

    // Replace variables in message
    let finalMessage = selectedMessage;
    if (finalMessage) {
        finalMessage = finalMessage.replace(/{nome}/gi, contactName);
        // Anti-banimento: cada mensagem enviada leva marcadores invisíveis únicos,
        // pra não ser detectada como conteúdo idêntico em massa.
        finalMessage = injectInvisibleMarker(finalMessage);
    }

    let result: any;

    // 📨 SEQUENTIAL MODE: Auto-split message into intelligent blocks
    if (sequentialMode && finalMessage) {
        console.log(`[CampaignWorker] Sequential mode enabled. Auto-splitting message...`);

        // 1. Send Media First if exists
        if ((mediaType === 'image' || mediaType === 'video') && mediaUrl) {
            const fallbackMimetype = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
            const { mediaData, mimetype } = readLocalMediaAsBase64(mediaUrl, fallbackMimetype);

            console.log(`[CampaignWorker] Ghost Action (Sequential): Uploading media simulation...`);
            await evolutionService.sendPresence(targetInstanceName, phone, 'composing');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Send media alone (without caption, since caption is split below into text blocks)
            const mediaResult = await evolutionService.sendMedia(targetInstanceName, phone, {
                media: mediaData,
                caption: '',
                mimetype,
                filename: mediaType === 'video' ? 'video.mp4' : 'image.jpg',
                mediatype: mediaType,
            });
            result = mediaResult;

            console.log(`[CampaignWorker] Media sent. Waiting ${blockDelay}s before starting text blocks...`);
            await new Promise(resolve => setTimeout(resolve, blockDelay * 1000));
        } else if (mediaType === 'audio' && mediaUrl) {
            const { mediaData, mimetype } = readLocalMediaAsBase64(mediaUrl, 'audio/mpeg');

            console.log(`[CampaignWorker] Ghost Action (Sequential): Recording audio simulation...`);
            await evolutionService.sendPresence(targetInstanceName, phone, 'recording');
            await new Promise(resolve => setTimeout(resolve, 3000));

            const mediaResult = await evolutionService.sendMedia(targetInstanceName, phone, {
                media: mediaData,
                mimetype,
                filename: 'audio.mp3',
                mediatype: 'audio',
            });
            result = mediaResult;

            console.log(`[CampaignWorker] Audio sent. Waiting ${blockDelay}s before starting text blocks...`);
            await new Promise(resolve => setTimeout(resolve, blockDelay * 1000));
        }

        // 2. Intelligent message splitting
        const blocks: string[] = [];

        // First, try to split by double line breaks (paragraphs)
        const paragraphs = finalMessage.split(/\n\n+/).filter((p: string) => p.trim().length > 0);

        if (paragraphs.length > 1) {
            // Use paragraphs as blocks
            blocks.push(...paragraphs.map((p: string) => p.trim()));
        } else {
            // If no paragraphs, split by single line breaks
            const lines = finalMessage.split(/\n/).filter((l: string) => l.trim().length > 0);

            if (lines.length > 1) {
                blocks.push(...lines.map((l: string) => l.trim()));
            } else {
                // If still one block, check if message is too long (>300 chars)
                if (finalMessage.length > 300) {
                    // Split by sentences
                    const sentences = finalMessage.match(/[^.!?]+[.!?]+/g) || [finalMessage];
                    blocks.push(...sentences.map((s: string) => s.trim()));
                } else {
                    // Message is short, send as single block
                    blocks.push(finalMessage);
                }
            }
        }

        console.log(`[CampaignWorker] Message split into ${blocks.length} blocks`);

        // Send each block with delay
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            console.log(`[CampaignWorker] Sending block ${i + 1}/${blocks.length} to ${contactName}`);

            // 👻 ANTI-BAN: GHOST TYPING FOR BLOCKS
            // Simulate typing for each block
            const typingTime = Math.min(Math.max(block.length * 50, 2000), 10000); // 50ms/char, min 2s, max 10s
            console.log(`[CampaignWorker] Ghost Typing (Sequential): ${typingTime}ms for ${block.length} chars...`);

            await evolutionService.sendPresence(targetInstanceName, phone, 'composing');
            await new Promise(resolve => setTimeout(resolve, typingTime));

            await evolutionService.sendText(targetInstanceName, phone, block);

            // Wait before sending next block (except for last block)
            if (i < blocks.length - 1) {
                console.log(`[CampaignWorker] Waiting ${blockDelay}s before next block...`);
                await new Promise(resolve => setTimeout(resolve, blockDelay * 1000));
            }
        }

        console.log(`[CampaignWorker] All ${blocks.length} blocks sent successfully to ${contactName}`);

        // If result wasn't set by media, set dummy success (or use last block ID if needed)
        if (!result) result = { success: true };
    } else {
        // 📧 STANDARD MODE: Send message based on media type
        if (mediaType === 'text' || !mediaUrl) {

            // 👻 ANTI-BAN: GHOST TYPING
            const typingTime = Math.min(Math.max(finalMessage.length * 50, 2000), 15000); // 50ms/char, min 2s, max 15s
            console.log(`[CampaignWorker] Ghost Typing: ${typingTime}ms for ${finalMessage.length} chars...`);

            await evolutionService.sendPresence(targetInstanceName, phone, 'composing');
            await new Promise(resolve => setTimeout(resolve, typingTime));

            console.log(`[CampaignWorker] Sending TEXT to ${targetInstanceName} -> ${phone}`);
            result = await evolutionService.sendText(targetInstanceName, phone, finalMessage);
            console.log(`[CampaignWorker] TEXT Sent successfully`);
        } else if (mediaType === 'image' || mediaType === 'video') {
            const fallbackMimetype = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
            const { mediaData, mimetype } = readLocalMediaAsBase64(mediaUrl, fallbackMimetype);

            console.log(`[CampaignWorker] Ghost Action: Uploading media simulation...`);
            await evolutionService.sendPresence(targetInstanceName, phone, 'composing');
            await new Promise(resolve => setTimeout(resolve, 3000));

            result = await evolutionService.sendMedia(targetInstanceName, phone, {
                media: mediaData,
                caption: finalMessage,
                mimetype,
                filename: mediaType === 'video' ? 'video.mp4' : 'image.jpg',
                mediatype: mediaType,
            });
        } else if (mediaType === 'audio') {
            const { mediaData, mimetype } = readLocalMediaAsBase64(mediaUrl, 'audio/mpeg');

            console.log(`[CampaignWorker] Ghost Action: Recording audio simulation...`);
            await evolutionService.sendPresence(targetInstanceName, phone, 'recording');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Áudio não aceita legenda na Evolution API — manda o áudio e o texto em seguida
            result = await evolutionService.sendMedia(targetInstanceName, phone, {
                media: mediaData,
                mimetype,
                filename: 'audio.mp3',
                mediatype: 'audio',
            });
            if (finalMessage) {
                await evolutionService.sendText(targetInstanceName, phone, finalMessage);
            }
        } else {
            // Fallback for other media types (document, etc.) - send as text link for now
            result = await evolutionService.sendText(targetInstanceName, phone, finalMessage + `\n\nArquivo: ${mediaUrl}`);
        }
    }

    // Update status in DB
    const evolutionMessageId = result?.key?.id || result?.id;
    if (evolutionMessageId) {
        console.log(`[CampaignWorker] Updating message ${job.data.id} with evolution_id ${evolutionMessageId}`);
        await supabase
            .from('campaign_messages')
            .update({
                evolution_message_id: evolutionMessageId,
                status: 'SENT',
                updated_at: new Date().toISOString()
            })
            .eq('id', job.data.id);
    }

}, {
    connection: redisConnection,
    concurrency: 1 // Sequential processing to respect delay between messages
});

campaignWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

campaignWorker.on('failed', async (job, err) => {
    console.error(`Job ${job?.id} failed: ${err.message}`);

    if (!job) return;

    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 1;

    if (attemptsMade >= maxAttempts) {
        console.error(`[CampaignWorker] Job ${job.id} exhausted all ${maxAttempts} attempts. Marking message ${job.data.id} as FAILED.`);
        await supabase
            .from('campaign_messages')
            .update({
                status: 'FAILED',
                error_message: err.message,
                updated_at: new Date().toISOString()
            })
            .eq('id', job.data.id);
    }
});
