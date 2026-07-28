import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  throw new Error('Missing Supabase URL or Keys in environment variables');
}

// Usa o fetch nativo do Node (undici) em vez de node-fetch v2 — mais robusto
// sob requisições concorrentes (node-fetch v2 tinha travamentos esporádicos
// no Windows sob carga paralela).

// Client with Service Role (Admin)
export const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey!, {
  auth: {
    persistSession: false
  }
});

// Client with Anon Key (For user-level auth verification)
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey!, {
  auth: {
    persistSession: false
  }
});
