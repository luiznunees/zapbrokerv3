import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', url);
console.log('Key Present:', !!key);

if (!url || !key) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(url, key);

// ... previous imports ...

async function testConnection() {
    try {
        console.log('Testing Google...');
        await fetch('https://google.com');
        console.log('Google OK.');

        console.log('Testing Supabase...');
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase Error:', error.message);
        } else {
            console.log('Supabase Success!');
        }
    } catch (err: any) {
        console.error('Fetch Error:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
    }
}

testConnection();
