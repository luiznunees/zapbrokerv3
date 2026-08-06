import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// O login por email/senha acontece via nosso backend (não direto por este client), então
// esse client só passa a ter uma sessão de verdade quando login/signup chamam
// supabase.auth.setSession(...) com o refresh_token que o backend já devolve. A partir daí,
// autoRefreshToken (padrão do SDK) renova sozinho — este listener só mantém o
// localStorage['token'] (o que fetchAPI em services/api.ts lê) sincronizado com isso.
if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange((event, session) => {
        if (session?.access_token) {
            localStorage.setItem('token', session.access_token)
        }
        if (event === 'SIGNED_OUT') {
            localStorage.removeItem('token')
        }
    })
}

export async function logoutUser() {
    await supabase.auth.signOut()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
}
