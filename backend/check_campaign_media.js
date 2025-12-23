const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, media_url, media_type')
        .eq('id', '30c4ec58-a4e1-41a6-beb5-14841092170b')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Campaign Data:', JSON.stringify(data, null, 2));
}

check();
