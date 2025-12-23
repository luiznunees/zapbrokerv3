const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('contacts').select('*').limit(5);
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Contacts Data:', JSON.stringify(data, null, 2));
}

check();
