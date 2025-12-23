"use client"

import { useState } from 'react'
import { Check, Shield, Zap, Loader2, LogOut } from 'lucide-react'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/BrandLogo'
import { PixQRCodeModal } from '@/components/payment/PixQRCodeModal'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

const PLANS = [
    {
        id: 'prod_ZxwseRQWbKLxHKsnfcUCMfYc',
        name: 'Básico',
        price: 29.90,
        description: 'Ideal para começar',
        features: ['1.000 mensagens/semana', '1 instância WhatsApp', '5 campanhas simultâneas']
    },
    {
        id: 'prod_n6CMApuNhHqPCUrL2JmHyWbz',
        name: 'Plus',
        price: 69.90,
        description: 'Mais popular',
        popular: true,
        features: ['5.000 mensagens/semana', '3 instâncias WhatsApp', '20 campanhas', 'Kanban de leads']
    },
    {
        id: 'prod_AXPStPBEeB5xrpubKyWB6EnY',
        name: 'Pro',
        price: 119.90,
        description: 'Para empresas',
        features: ['15.000 mensagens/semana', 'Instâncias ilimitadas', 'Campanhas ilimitadas', 'Kanban + AI Agent']
    }
]

export default function PaymentOnboardingPage() {
    const searchParams = useSearchParams()
    const status = searchParams.get('status')

    // Default to Plus plan
    const [selectedPlanId, setSelectedPlanId] = useState(PLANS[1].id)

    const [loadingPayment, setLoadingPayment] = useState(false)
    const [pixData, setPixData] = useState<any>(null)
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
    const [billingDetails, setBillingDetails] = useState({
        name: '',
        email: '',
        cellphone: '',
        taxId: ''
    })

    const handleCreatePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoadingPayment(true);
            const response = await api.payments.createSubscription(selectedPlanId, billingDetails);
            setPixData(response.pix);
            setSubscriptionId(response.subscriptionId);
        } catch (err) {
            console.error(err);
            alert('Erro ao gerar pagamento via PIX. Verifique seus dados.');
        } finally {
            setLoadingPayment(false);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background flex flex-col">
                {/* Header */}
                <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-10 w-full">
                    <div className="flex items-center gap-2">
                        <BrandLogo className="h-6 w-auto" />
                    </div>
                    <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1">
                        <LogOut className="w-4 h-4" /> Sair
                    </button>
                </header>

                <main className="flex-1 container max-w-5xl mx-auto px-4 py-12">

                    <div className="text-center mb-12 space-y-4">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                            {status === 'expired' ? 'Sua assinatura expirou 😐' : 'Ative sua conta 🚀'}
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            {status === 'expired'
                                ? 'Para continuar usando o ZapBroker e manter seus disparos ativos, renove seu plano abaixo.'
                                : 'Escolha um plano para liberar seu acesso ao Dashboard e começar a automatizar suas vendas.'}
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 items-start">

                        {/* Left: Plans */}
                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                            {PLANS.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={cn(
                                        "relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg",
                                        selectedPlanId === plan.id
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-border bg-card hover:border-primary/50"
                                    )}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-sm">
                                            Mais Popular
                                        </div>
                                    )}
                                    <div className="mb-4">
                                        <h4 className="font-bold text-lg">{plan.name}</h4>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-black">R$ {plan.price.toFixed(2)}</span>
                                            <span className="text-xs text-muted-foreground">/mês</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-2">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Right: Payment Form */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl sticky top-24">
                            <div className="mb-6 pb-6 border-b border-border">
                                <h3 className="font-bold text-lg mb-1">Finalizar Assinatura</h3>
                                <p className="text-sm text-muted-foreground">
                                    Plano selecionado: <span className="font-bold text-foreground">{PLANS.find(p => p.id === selectedPlanId)?.name}</span>
                                </p>
                            </div>

                            <form onSubmit={handleCreatePayment} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5 ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={billingDetails.name}
                                        onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Seu nome"
                                        className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5 ml-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={billingDetails.email}
                                        onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="seu@email.com"
                                        className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5 ml-1">CPF / CNPJ</label>
                                        <input
                                            type="text"
                                            required
                                            value={billingDetails.taxId}
                                            onChange={(e) => setBillingDetails(prev => ({ ...prev, taxId: e.target.value }))}
                                            placeholder="000.000.000-00"
                                            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5 ml-1">WhatsApp</label>
                                        <input
                                            type="tel"
                                            required
                                            value={billingDetails.cellphone}
                                            onChange={(e) => setBillingDetails(prev => ({ ...prev, cellphone: e.target.value }))}
                                            placeholder="(11) 9..."
                                            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loadingPayment}
                                    className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                                >
                                    {loadingPayment ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5 fill-current" />
                                            Gerar PIX de R$ {PLANS.find(p => p.id === selectedPlanId)?.price.toFixed(2)}
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <Shield className="w-3 h-3" /> Ambiete seguro. Cancelamento grátis.
                            </div>
                        </div>
                    </div>
                </main>

                {/* Using the existing PixQRCodeModal we saw in SettingsPage, but imported */}
                {pixData && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95">
                            <h3 className="text-xl font-bold">Escaneie para Pagar</h3>
                            <div className="bg-white p-4 rounded-xl border-2 border-primary/20 inline-block">
                                {/* Assuming pixData.brCodeBase64 is the image data url */}
                                <img src={pixData.brCodeBase64 || pixData.encodedImage} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Ou copie o código:</p>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={pixData.brCode || pixData.payload}
                                        className="flex-1 bg-muted px-3 py-2 rounded text-xs truncate font-mono"
                                    />
                                    <button
                                        onClick={() => navigator.clipboard.writeText(pixData.brCode || pixData.payload)}
                                        className="bg-primary text-white px-3 py-2 rounded text-xs font-bold"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.href = '/dashboard'} // Optimistic redirect, or wait for webhook
                                className="w-full py-3 bg-secondary text-secondary-foreground font-bold rounded-xl"
                            >
                                Já Paguei (Liberar Acesso)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    )
}
