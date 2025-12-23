import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { getIO } from '../services/socketService';

export const handleWahaWebhook = async (req: Request, res: Response) => {
    try {
        const { event, session, payload } = req.body;

        console.log('--- WAHA Webhook Received ---');
        console.log('Event:', event);
        console.log('Session:', session);
        // console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('-----------------------------');

        if (event === 'message') {
            const { id, from, to, body, hasMedia, timestamp, _data } = payload;

            // Ignore status messages or broadcast
            if (from === 'status@broadcast') return res.status(200).send('OK');

            const isFromMe = payload.fromMe || false;
            const remoteJid = isFromMe ? to : from;

            console.log(`Processing Message: JID=${remoteJid}, FromMe=${isFromMe}`);

            if (remoteJid) {
                const phone = remoteJid.split('@')[0];

                // Brazilian 9th digit handling
                let possiblePhones = [phone];
                if (phone.length === 12 && phone.startsWith('55')) {
                    const phoneWith9 = phone.slice(0, 4) + '9' + phone.slice(4);
                    possiblePhones.push(phoneWith9);
                } else if (phone.length === 13 && phone.startsWith('55') && phone[4] === '9') {
                    const phoneWithout9 = phone.slice(0, 4) + phone.slice(5);
                    possiblePhones.push(phoneWithout9);
                }

                let { data: contact } = await supabase
                    .from('contacts')
                    .select('id, unread_count')
                    .in('phone', possiblePhones)
                    .maybeSingle();

                if (contact) {
                    console.log(`Contact found: ${contact.id}`);

                    let content = body || '';
                    let mediaUrl = null;
                    let msgType = 'text';

                    if (hasMedia) {
                        msgType = 'image'; // Simplify to image for now
                        if (payload.mediaUrl) mediaUrl = payload.mediaUrl;
                    }

                    await supabase.from('messages').insert([{
                        contact_id: contact.id,
                        instance_id: null, // We could fetch instance by session name
                        evolution_id: id,
                        remote_jid: remoteJid,
                        from_me: isFromMe,
                        type: msgType,
                        content: content,
                        media_url: mediaUrl,
                        is_read: false
                    }]);

                    if (!isFromMe) {
                        // Update Contact Status
                        await supabase.from('contacts').update({
                            status: 'Replied',
                            last_interaction_at: new Date().toISOString(),
                            unread_count: (contact.unread_count || 0) + 1
                        }).eq('id', contact.id);

                        // Update Campaign Lead Status to REPLIED
                        const { data: campaignMsgs, error: campMsgError } = await supabase
                            .from('campaign_messages')
                            .select('id, campaign_id')
                            .eq('contact_id', contact.id)
                            .order('updated_at', { ascending: false })
                            .limit(1);

                        const lastCampaignMsg = campaignMsgs && campaignMsgs.length > 0 ? campaignMsgs[0] : null;

                        if (lastCampaignMsg) {
                            console.log(`Updating campaign message ${lastCampaignMsg.id} to REPLIED`);
                            await supabase
                                .from('campaign_messages')
                                .update({ lead_status: 'REPLIED' })
                                .eq('id', lastCampaignMsg.id);

                            try {
                                const io = getIO();
                                io.to(`campaign:${lastCampaignMsg.campaign_id}`).emit('lead_update', {
                                    messageId: lastCampaignMsg.id,
                                    status: 'REPLIED'
                                });
                            } catch (e) {
                                console.error('Socket emit error:', e);
                            }
                        }
                    }
                }
            }
        } else if (event === 'message.ack') {
            const { id, ack } = payload;
            // ack: 1 (sent), 2 (received), 3 (read), 4 (played) - WAHA/Puppeteer standard

            console.log(`Processing Message Ack: ID=${id}, Ack=${ack}`);

            let dbStatus = 'SENT';
            let leadStatus = 'SENT';

            if (ack >= 2) {
                dbStatus = 'DELIVERED';
            }
            if (ack >= 3) {
                dbStatus = 'READ';
                leadStatus = 'READ';
            }

            const updateData: any = { status: dbStatus, updated_at: new Date().toISOString() };
            if (leadStatus === 'READ') {
                updateData.lead_status = leadStatus;
            }

            const { error: updateError, data: updatedData } = await supabase
                .from('campaign_messages')
                .update(updateData)
                .eq('evolution_message_id', id)
                .select('id, campaign_id');

            if (updatedData && updatedData.length > 0) {
                try {
                    const io = getIO();
                    io.to(`campaign:${updatedData[0].campaign_id}`).emit('lead_update', {
                        messageId: updatedData[0].id,
                        status: leadStatus,
                        technicalStatus: dbStatus
                    });
                } catch (e) {
                    console.error('Socket emit error:', e);
                }
            }
        } else if (event === 'state.change') {
            // payload: { status: 'WORKING' | 'STOPPED' | ... }
            // We might want to update instance status here
        }

        res.status(200).send('OK');
    } catch (error: any) {
        console.error('Webhook error:', error.message);
        res.status(500).send('Error processing webhook');
    }
};
export const handleEvolutionWebhook = async (req: Request, res: Response) => {
    try {
        const { event, data } = req.body;
        console.log(`[EvolutionWebhook] Event: ${event}`);

        if (event === 'messages.update') {
            const updates = Array.isArray(data) ? data : [data];
            for (const item of updates) {
                const { key, update } = item;
                if (!key || !update) continue;

                const messageId = key.id;
                const status = update.status;

                console.log(`[EvolutionWebhook] Message ${messageId} status update: ${status}`);

                let dbStatus = 'SENT';
                let leadStatus = 'SENT';

                // Evolution status mapping: 2=DELIVERED, 3=READ
                if (status === 'DELIVERY_ACK' || status === 2) {
                    dbStatus = 'DELIVERED';
                } else if (status === 'READ' || status === 3) {
                    dbStatus = 'READ';
                    leadStatus = 'READ';
                } else {
                    continue; // Ignore other statuses for now
                }

                const updateData: any = { status: dbStatus, updated_at: new Date().toISOString() };
                if (leadStatus === 'READ') {
                    updateData.lead_status = leadStatus;
                }

                const { data: updatedMessages } = await supabase
                    .from('campaign_messages')
                    .update(updateData)
                    .eq('evolution_message_id', messageId)
                    .select('id, campaign_id');

                if (updatedMessages && updatedMessages.length > 0) {
                    try {
                        const io = getIO();
                        io.to(`campaign:${updatedMessages[0].campaign_id}`).emit('lead_update', {
                            messageId: updatedMessages[0].id,
                            status: leadStatus,
                            technicalStatus: dbStatus
                        });
                    } catch (e) {
                        console.error('Socket emit error:', e);
                    }
                }
            }
        } else if (event === 'messages.upsert') {
            const key = data.key;
            if (key && !key.fromMe) {
                const remoteJid = key.remoteJid;
                const phone = remoteJid.split('@')[0];

                // Brazilian 9th digit handling
                let possiblePhones = [phone];
                if (phone.length === 12 && phone.startsWith('55')) {
                    const phoneWith9 = phone.slice(0, 4) + '9' + phone.slice(4);
                    possiblePhones.push(phoneWith9);
                } else if (phone.length === 13 && phone.startsWith('55') && phone[4] === '9') {
                    const phoneWithout9 = phone.slice(0, 4) + phone.slice(5);
                    possiblePhones.push(phoneWithout9);
                }

                let { data: contact } = await supabase
                    .from('contacts')
                    .select('id')
                    .in('phone', possiblePhones)
                    .maybeSingle();

                if (contact) {
                    // Update Campaign Lead Status to REPLIED
                    const { data: campaignMsgs } = await supabase
                        .from('campaign_messages')
                        .select('id, campaign_id')
                        .eq('contact_id', contact.id)
                        .order('updated_at', { ascending: false })
                        .limit(1);

                    const lastCampaignMsg = campaignMsgs && campaignMsgs.length > 0 ? campaignMsgs[0] : null;

                    if (lastCampaignMsg) {
                        console.log(`[EvolutionWebhook] Updating campaign message ${lastCampaignMsg.id} to REPLIED`);
                        await supabase
                            .from('campaign_messages')
                            .update({ lead_status: 'REPLIED', updated_at: new Date().toISOString() })
                            .eq('id', lastCampaignMsg.id);

                        try {
                            const io = getIO();
                            io.to(`campaign:${lastCampaignMsg.campaign_id}`).emit('lead_update', {
                                messageId: lastCampaignMsg.id,
                                status: 'REPLIED'
                            });
                        } catch (e) {
                            console.error('Socket emit error:', e);
                        }
                    }
                }
            }
        }

        res.status(200).send('OK');
    } catch (error: any) {
        console.error('[EvolutionWebhook] Error:', error.message);
        res.status(500).send('Error processing webhook');
    }
};
