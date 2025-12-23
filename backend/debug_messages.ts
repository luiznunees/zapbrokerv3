
import { supabase } from './src/config/supabase';
const fs = require('fs');

async function checkMessages() {
    console.log('Checking message statuses...');

    const { data: pending, error: err1 } = await supabase
        .from('campaign_messages')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING');

    const { data: queued, error: err2 } = await supabase
        .from('campaign_messages')
        .select('id', { count: 'exact' })
        .eq('status', 'QUEUED');

    const { data: sent, error: err3 } = await supabase
        .from('campaign_messages')
        .select('id', { count: 'exact' })
        .eq('status', 'SENT');

    const { data: failed, error: err4 } = await supabase
        .from('campaign_messages')
        .select('id', { count: 'exact' })
        .eq('status', 'FAILED');

    let failedDetails = [];
    if (failed && failed.length > 0) {
        const { data } = await supabase
            .from('campaign_messages')
            .select('id, error_message, updated_at')
            .eq('status', 'FAILED')
            .order('updated_at', { ascending: false })
            .limit(5);
        failedDetails = data || [];
    }

    const result = {
        PENDING: pending?.length,
        QUEUED: queued?.length,
        SENT: sent?.length,
        FAILED: failed?.length,
        RecentFailures: failedDetails
    };

    fs.writeFileSync('debug_output.json', JSON.stringify(result, null, 2));
    console.log('Output written to debug_output.json');

    if (err1 || err2 || err3 || err4) {
        console.error('Errors:', err1, err2, err3, err4);
    }
}

checkMessages();
