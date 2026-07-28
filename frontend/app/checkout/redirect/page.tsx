'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Lock, Check, Copy, CheckCheck, Clock } from 'lucide-react';
import { api } from '@/services/api';
import { PLAN_INFO } from '@/lib/plans';

function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function isValidCpf(value: string): boolean {
    const cpf = value.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const digits = cpf.split('').map(Number);
    const calcCheckDigit = (length: number) => {
        let sum = 0;
        for (let i = 0; i < length; i++) sum += digits[i] * (length + 1 - i);
        const remainder = (sum * 10) % 11;
        return remainder === 10 ? 0 : remainder;
    };

    return calcCheckDigit(9) === digits[9] && calcCheckDigit(10) === digits[10];
}

function formatCellphone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
}

type PixCharge = {
    subscriptionId: string;
    brCode: string;
    brCodeBase64: string;
    expiresAt: string;
};

export default function CheckoutRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [cpf, setCpf] = useState('');
    const [cellphone, setCellphone] = useState('');
    const [charge, setCharge] = useState<PixCharge | null>(null);
    const [copied, setCopied] = useState(false);
    const [checkingExisting, setCheckingExisting] = useState(false);
    const hasRun = useRef(false);

    const planId = searchParams.get('planId');
    const existingSubscriptionId = searchParams.get('subscriptionId');
    const plan = planId ? PLAN_INFO[planId] : undefined;
    const cpfDigits = cpf.replace(/\D/g, '');
    const cpfTouched = cpfDigits.length > 0;
    const cpfInvalid = cpfTouched && cpfDigits.length === 11 && !isValidCpf(cpf);
    const canSubmit = isValidCpf(cpf) && cellphone.replace(/\D/g, '').length >= 10;

    const isExpired = charge ? new Date(charge.expiresAt).getTime() < Date.now() : false;

    useEffect(() => {
        if (!planId) {
            router.push('/dashboard');
            return;
        }
        // If this user already has CPF/celular on file from a previous attempt
        // (e.g. a PIX charge that expired), don't make them retype it.
        api.auth.me()
            .then((data: any) => {
                const u = data?.user || data;
                if (u?.pixCpf) setCpf(formatCpf(u.pixCpf));
                if (u?.pixCellphone) setCellphone(formatCellphone(u.pixCellphone));
            })
            .catch(() => {});
    }, [planId, router]);

    // Coming from a renewal reminder email — load the already-generated PIX for this cycle
    // instead of creating a new one.
    useEffect(() => {
        if (!existingSubscriptionId) return;
        setCheckingExisting(true);
        api.payments.getSubscriptionStatus(existingSubscriptionId)
            .then((data: any) => {
                if (data.status === 'active') {
                    router.push('/dashboard');
                    return;
                }
                if (data.brCodeBase64 && data.brCode) {
                    setCharge({
                        subscriptionId: existingSubscriptionId,
                        brCode: data.brCode,
                        brCodeBase64: data.brCodeBase64,
                        expiresAt: data.expiresAt,
                    });
                }
            })
            .catch(() => {})
            .finally(() => setCheckingExisting(false));
    }, [existingSubscriptionId, router]);

    // Poll for payment confirmation while a QR code is being shown.
    useEffect(() => {
        if (!charge || isExpired) return;

        const interval = setInterval(async () => {
            try {
                const data = await api.payments.getSubscriptionStatus(charge.subscriptionId);
                if (data.status === 'active') {
                    clearInterval(interval);
                    router.push('/dashboard');
                }
            } catch {
                // transient network error — keep polling
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [charge, isExpired, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hasRun.current || !planId) return;
        hasRun.current = true;
        setLoading(true);

        try {
            const response = await api.payments.createSubscription(planId, { cpf, cellphone });

            if (response.brCodeBase64 && response.brCode) {
                setCharge({
                    subscriptionId: response.subscriptionId,
                    brCode: response.brCode,
                    brCodeBase64: response.brCodeBase64,
                    expiresAt: response.expiresAt,
                });
            } else {
                throw new Error('PIX não recebido');
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message || 'Erro ao preparar checkout');
            hasRun.current = false;
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = useCallback(() => {
        if (!charge) return;
        navigator.clipboard.writeText(charge.brCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [charge]);

    const handleRetry = () => {
        setError(null);
        setCharge(null);
        hasRun.current = false;
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 max-w-md text-center border border-red-100">
                    <p className="font-bold mb-1">Ops! Algo deu errado</p>
                    <p className="text-sm">{error}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRetry}
                        className="px-6 py-2 bg-brand-purple-600 text-white rounded-md text-sm font-bold shadow-lg"
                    >
                        Tentar novamente
                    </button>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2 bg-white text-zinc-600 border border-zinc-300 rounded-md text-sm font-bold"
                    >
                        Ir para o Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (loading || checkingExisting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
                <div className="max-w-xs w-full text-center space-y-6 animate-in fade-in duration-700">
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand-purple-400/20 blur-2xl rounded-full" />
                        <ShieldCheck className="h-16 w-16 text-brand-purple-600 mx-auto relative animate-bounce" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl font-bold text-zinc-900">Preparando pagamento</h1>
                        <p className="text-zinc-500 text-sm">Gerando seu PIX...</p>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-zinc-400 text-xs">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Só um instante...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (charge) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col">
                <header className="border-b border-zinc-200 bg-white">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-brand-purple-600" />
                        <span className="font-bold text-zinc-900 text-sm">ZapBroker</span>
                        <span className="text-zinc-300 text-sm">/</span>
                        <span className="text-zinc-500 text-sm">Pagamento via PIX</span>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center p-4 py-10">
                    <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-xl p-6 text-center space-y-5">
                        {isExpired ? (
                            <>
                                <Clock className="h-10 w-10 text-amber-500 mx-auto" />
                                <div>
                                    <h1 className="text-lg font-bold text-zinc-900">O PIX expirou</h1>
                                    <p className="text-zinc-500 text-sm mt-1">Gere um novo código para continuar.</p>
                                </div>
                                <button
                                    onClick={handleRetry}
                                    className="w-full py-3 bg-brand-purple-600 text-white rounded-md text-sm font-bold shadow-lg"
                                >
                                    Gerar novo PIX
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h1 className="text-lg font-bold text-zinc-900">Pague com PIX para ativar sua assinatura</h1>
                                    {plan && (
                                        <p className="text-zinc-500 text-sm mt-1">
                                            Plano {plan.name} · R$ {plan.price.toFixed(2).replace('.', ',')}/mês
                                        </p>
                                    )}
                                </div>

                                <img
                                    src={charge.brCodeBase64}
                                    alt="QR Code PIX"
                                    className="w-56 h-56 mx-auto border border-zinc-200 rounded-lg p-2"
                                />

                                <div className="space-y-1.5 text-left">
                                    <label className="text-xs font-medium text-zinc-500">Ou copie o código</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={charge.brCode}
                                            className="flex-1 min-w-0 text-xs border border-zinc-300 rounded-md px-2 py-2 bg-zinc-50 text-zinc-600 truncate"
                                        />
                                        <button
                                            onClick={handleCopy}
                                            className="shrink-0 flex items-center gap-1 px-3 py-2 bg-zinc-900 text-white rounded-md text-xs font-medium"
                                        >
                                            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copied ? 'Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm pt-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Aguardando pagamento...</span>
                                </div>

                                <p className="text-[11px] text-zinc-400">
                                    A confirmação é automática — assim que o PIX cair, você é redirecionado pro seu painel.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <header className="border-b border-zinc-200 bg-white">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand-purple-600" />
                    <span className="font-bold text-zinc-900 text-sm">ZapBroker</span>
                    <span className="text-zinc-300 text-sm">/</span>
                    <span className="text-zinc-500 text-sm">Checkout seguro</span>
                </div>
            </header>

            <div className="flex-1 flex items-start justify-center p-4 py-10">
                <div className="w-full max-w-4xl grid md:grid-cols-5 gap-6">
                    {/* Resumo do pedido */}
                    <div className="md:col-span-2 order-2 md:order-1">
                        <div className="bg-white border border-zinc-200 rounded-xl p-6 sticky top-6">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Resumo do pedido</p>

                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-zinc-900">Plano {plan?.name ?? 'ZapBroker'}</span>
                                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">Mensal</span>
                            </div>

                            <div className="flex items-baseline gap-1 mb-5">
                                <span className="text-2xl font-extrabold text-zinc-900">
                                    {plan ? `R$ ${plan.price.toFixed(2).replace('.', ',')}` : '—'}
                                </span>
                                <span className="text-zinc-400 text-sm">/mês</span>
                            </div>

                            {plan && (
                                <ul className="space-y-2 mb-5">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                                            <Check className="w-4 h-4 text-brand-purple-600 shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                                <span className="text-sm font-medium text-zinc-500">Total hoje</span>
                                <span className="font-bold text-zinc-900">
                                    {plan ? `R$ ${plan.price.toFixed(2).replace('.', ',')}` : '—'}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">Você recebe um novo PIX todo mês para renovar — sem cobrança automática no cartão. Cancele quando quiser.</p>
                        </div>
                    </div>

                    {/* Formulário */}
                    <div className="md:col-span-3 order-1 md:order-2">
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5"
                        >
                            <div>
                                <h1 className="text-lg font-bold text-zinc-900">Finalizar assinatura</h1>
                                <p className="text-zinc-500 text-sm mt-0.5">Confirme seus dados para gerar o PIX</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-zinc-700">CPF</label>
                                <input
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    value={cpf}
                                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                                    placeholder="000.000.000-00"
                                    className={`w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple-500 focus:border-transparent ${cpfInvalid ? 'border-red-400' : 'border-zinc-300'}`}
                                />
                                {cpfInvalid && <p className="text-xs text-red-500">CPF inválido. Confira os números digitados.</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-zinc-700">Celular</label>
                                <input
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    value={cellphone}
                                    onChange={(e) => setCellphone(formatCellphone(e.target.value))}
                                    placeholder="(11) 91234-5678"
                                    className="w-full border border-zinc-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700">Forma de pagamento</label>
                                <div className="flex items-center gap-2 border border-zinc-200 bg-zinc-50 rounded-md px-3 py-2.5 text-sm text-zinc-600">
                                    <ShieldCheck className="w-4 h-4" />
                                    PIX — QR code aparece aqui mesmo, sem sair do site
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="w-full py-3 bg-brand-purple-600 text-white rounded-md text-sm font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
                            >
                                <Lock className="w-4 h-4" />
                                Gerar PIX
                            </button>

                            <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 pt-1">
                                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Dados criptografados</span>
                                <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Processado pela AbacatePay</span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
