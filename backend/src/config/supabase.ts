import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  throw new Error('Missing Supabase URL or Keys in environment variables');
}

// Client with Service Role (Admin)
export const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey!, {
  auth: {
    persistSession: false
  },
  global: {
    fetch: fetch as any
  }
});

// Client with Anon Key (For user-level auth verification)
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey!, {
  auth: {
    persistSession: false
  },
  global: {
    fetch: fetch as any
  }
});
