'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { api } from '@/services/api';

// Safe initialization for Docker build time where envs might be missing
const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder.com';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
    return createClient(url, key);
};

const supabase = getSupabase();

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

                // Sync Location
                try {
                    const geoRes = await fetch('https://geoip.vuiz.net/geoip');
                    const geoData = await geoRes.json();
                    if (geoData && geoData.city) {
                        await api.auth.updateProfile({
                            onboarding_steps: {
                                ...(session.user as any).onboarding_steps,
                                last_location: `${geoData.city}, ${geoData.countryCode}`,
                                last_geo_ip: geoData.ip
                            }
                        });
                    }
                } catch (e) {
                    console.error('GeoIP sync failed in callback', e);
                }

                // Check if we have a planId to process
                const urlParams = new URLSearchParams(window.location.search);
                const planId = urlParams.get('planId') || localStorage.getItem('pendingPlanId');

                if (planId) {
                    localStorage.removeItem('pendingPlanId');
                    router.push(`/checkout/redirect?planId=${planId}`);
                } else {
                    router.push('/dashboard');
                }
            } else {
                // Handle case where we were redirected but no session found
                // Usually this happens if the hash fragment is missing or invalid
                // Try to parse from URL hash just in case
                supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        console.log('✅ Session found via onAuthStateChange!');
                        localStorage.setItem('token', session.access_token);
                        localStorage.setItem('user', JSON.stringify(session.user));

                        const savedPlanId = localStorage.getItem('pendingPlanId');
                        if (savedPlanId) {
                            localStorage.removeItem('pendingPlanId');
                            router.push(`/checkout/redirect?planId=${savedPlanId}`);
                        } else {
                            router.push('/dashboard');
                        }
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
