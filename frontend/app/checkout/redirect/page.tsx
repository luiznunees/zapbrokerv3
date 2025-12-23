'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api';

export default function CheckoutRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const hasRun = useRef(false);

    useEffect(() => {
        const createSession = async () => {
            if (hasRun.current) return;
            hasRun.current = true;

            const planId = searchParams.get('planId');

            if (!planId) {
                router.push('/dashboard');
                return;
            }

            try {
                const response = await api.payments.createSubscription(planId, {});

                if (response.checkoutUrl) {
                    window.location.href = response.checkoutUrl;
                } else {
                    throw new Error('Url de checkout não recebida');
                }
            } catch (err: any) {
                console.error('Checkout error:', err);
                setError(err.message || 'Erro ao preparar checkout');
            }
        };

        createSession();
    }, [searchParams, router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4 max-w-md text-center">
                    <p className="font-bold mb-1">Ops! Algo deu errado</p>
                    <p className="text-sm">{error}</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-2 bg-brand-purple-600 text-white rounded-md text-sm font-bold shadow-lg"
                >
                    Ir para o Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
            <div className="max-w-xs w-full text-center space-y-6 animate-in fade-in duration-700">
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-purple-400/20 blur-2xl rounded-full" />
                    <ShieldCheck className="h-16 w-16 text-brand-purple-600 mx-auto relative animate-bounce" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-bold text-zinc-900">Preparando pagamento seguro</h1>
                    <p className="text-zinc-500 text-sm">Você será redirecionado para a plataforma da AbacatePay em instantes...</p>
                </div>

                <div className="flex items-center justify-center gap-3 text-zinc-400 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Iniciando checkout seguro...</span>
                </div>
            </div>
        </div>
    );
}
