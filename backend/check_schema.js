const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const tables = ['instances', 'campaigns', 'contacts', 'contact_lists'];
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.error(`Error fetching table ${table}:`, error.message);
            } else {
                console.log(`Table: ${table}`, data && data.length > 0 ? Object.keys(data[0]) : 'Empty');
            }
        } catch (err) {
            console.error(`Exception for table ${table}:`, err.message);
        }
    }
}

check();
