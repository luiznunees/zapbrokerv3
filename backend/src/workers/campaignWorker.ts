import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import * as evolutionService from '../services/evolutionService';
import fs from 'fs';
import path from 'path';

export const campaignWorker = new Worker('campaign-dispatch', async (job) => {
    const { campaignId, contactId, messageVariations, instanceId, mediaType, mediaUrl, delay, sequentialMode, blockDelay } = job.data;

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

    // Delay handling (if needed per job, though BullMQ has delay option)
    if (delay) {
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

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
    }

    let result: any;

    // 📨 SEQUENTIAL MODE: Auto-split message into intelligent blocks
    if (sequentialMode && finalMessage) {
        console.log(`[CampaignWorker] Sequential mode enabled. Auto-splitting message...`);

        // Intelligent message splitting
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

            await evolutionService.sendText(targetInstanceName, phone, block);

            // Wait before sending next block (except for last block)
            if (i < blocks.length - 1) {
                console.log(`[CampaignWorker] Waiting ${blockDelay}s before next block...`);
                await new Promise(resolve => setTimeout(resolve, blockDelay * 1000));
            }
        }

        console.log(`[CampaignWorker] All ${blocks.length} blocks sent successfully to ${contactName}`);
        result = { success: true }; // Dummy result for sequential mode
    } else {
        // 📧 STANDARD MODE: Send message based on media type
        if (mediaType === 'text' || !mediaUrl) {
            console.log(`[CampaignWorker] Sending TEXT to ${targetInstanceName} -> ${phone}`);
            result = await evolutionService.sendText(targetInstanceName, phone, finalMessage);
            console.log(`[CampaignWorker] TEXT Sent successfully`);
        } else if (mediaType === 'image') {
            let mediaData = mediaUrl;
            let mimetype = 'image/jpeg';

            // If it's a local URL, try to read the file and convert to base64
            if (mediaUrl && (mediaUrl.includes('localhost') || mediaUrl.includes('127.0.0.1'))) {
                try {
                    const filename = mediaUrl.split('/').pop();
                    const filePath = path.join(process.cwd(), 'uploads', filename);
                    console.log(`[CampaignWorker] Local image detected. Reading from: ${filePath}`);

                    if (fs.existsSync(filePath)) {
                        const fileBuffer = fs.readFileSync(filePath);
                        const extension = path.extname(filePath).toLowerCase().replace('.', '');
                        mimetype = extension === 'png' ? 'image/png' : 'image/jpeg';
                        // Evolution API often prefers pure base64 without prefix when mimetype is provided
                        mediaData = fileBuffer.toString('base64');
                        console.log(`[CampaignWorker] Image converted to pure base64 successfully (mimetype: ${mimetype})`);
                    } else {
                        console.warn(`[CampaignWorker] Local file not found: ${filePath}`);
                    }
                } catch (err: any) {
                    console.error('[CampaignWorker] Failed to convert local image to base64:', err.message);
                }
            }

            result = await evolutionService.sendImage(targetInstanceName, phone, {
                media: mediaData,
                caption: finalMessage,
                mimetype: mimetype,
                filename: 'image.jpg'
            });
        } else {
            // Fallback for other media types (video, audio) - send as text link for now or implement sendFile
            result = await evolutionService.sendText(targetInstanceName, phone, finalMessage + `\n\nMedia: ${mediaUrl}`);
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

campaignWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed: ${err.message}`);
});
