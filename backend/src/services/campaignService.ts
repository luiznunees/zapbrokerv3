import { supabase } from '../config/supabase';

export const createCampaign = async (
    userId: string,
    name: string,
    message: string,
    contactListId: string,
    instanceId: string,
    scheduledAt?: string,
    delaySeconds: number = 5,
    batchSize: number = 30,
    batchDelaySeconds: number = 60,
    mediaType: string = 'text',
    mediaUrl?: string
) => {
    // 0. Verify Ownership of List and Instance
    const { data: list } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('id', contactListId)
        .eq('user_id', userId)
        .single();

    if (!list) throw new Error('Contact list not found or access denied');

    const { data: instance } = await supabase
        .from('instances')
        .select('id')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

    if (!instance) throw new Error('WhatsApp instance not found or access denied');

    // 1. Create Campaign
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
            user_id: userId,
            name,
            message,
            contact_list_id: contactListId,
            instance_id: instanceId,
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

    // 2. Fetch Contacts
    const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, phone')
        .eq('list_id', contactListId);

    if (contactsError) {
        throw new Error(contactsError.message);
    }

    if (!contacts || contacts.length === 0) {
        return campaign; // No contacts to process
    }

    // 3. Create Messages
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
