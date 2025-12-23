'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error handling auth callback:', error);
                setError(error.message);
                return;
            }

            if (session) {
                console.log('✅ Session found via Supabase!');
                // Bridge: Copy session to LocalStorage for our app's logic
                localStorage.setItem('token', session.access_token);
                localStorage.setItem('user', JSON.stringify(session.user));

                // Redirect to dashboard
                router.push('/dashboard');
            } else {
                // Handle case where we were redirected but no session found
                // Usually this happens if the hash fragment is missing or invalid
                // Try to parse from URL hash just in case
                supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        console.log('✅ Session found via onAuthStateChange!');
                        localStorage.setItem('token', session.access_token);
                        localStorage.setItem('user', JSON.stringify(session.user));
                        router.push('/dashboard');
                    }
                });
            }
        };

        handleAuthCallback();
    }, [router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <div className="text-destructive mb-4">Erro na autenticação</div>
                <div className="text-sm text-muted-foreground mb-4">{error}</div>
                <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                >
                    Voltar para Login
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-sm">Finalizando autenticação...</p>
        </div>
    );
}
