"use client"

import { useState } from 'react'
import { Check, Shield, CreditCard, Zap } from 'lucide-react'
import { api } from '@/services/api'
import { PixQRCodeModal } from '@/components/payment/PixQRCodeModal'

const PLANS = [
    {
        id: 'prod_ZxwseRQWbKLxHKsnfcUCMfYc',
        name: 'Básico',
        price: 29.00,
        description: 'Ideal para começar',
        features: ['50 mensagens/semana', '1 conexão WhatsApp', 'IA Personalizável', 'Sistema Anti-Ban', 'Suporte por email']
    },
    {
        id: 'prod_n6CMApuNhHqPCUrL2JmHyWbz',
        name: 'Plus',
        price: 69.00,
        description: 'Mais popular',
        popular: true,
        features: ['125 mensagens/semana', '2 conexões WhatsApp', 'IA Personalizável', 'Analytics avançado', 'Suporte prioritário']
    },
    {
        id: 'prod_AXPStPBEeB5xrpubKyWB6EnY',
        name: 'Pro',
        price: 119.00,
        description: 'Para empresas',
        features: ['250 mensagens/semana', '5 conexões WhatsApp', 'IA Personalizável', 'API Access', 'Suporte VIP']
    }
]

export default function CheckoutPage() {
    const [selectedPlanId, setSelectedPlanId] = useState(PLANS[1].id) // Plus por padrão
    const [loading, setLoading] = useState(false)
    const [pixData, setPixData] = useState<any>(null)
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null)

    const [customer, setCustomer] = useState({
        name: '',
        email: '',
        cellphone: '',
        taxId: ''
    })

    const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[1]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!customer.name || !customer.email || !customer.cellphone || !customer.taxId) {
            console.warn('Missing required fields');
            return
        }

        try {
            setLoading(true)
            const response = await api.payments.createSubscription(selectedPlanId, customer)
            setPixData(response.pix)
            setSubscriptionId(response.subscriptionId)
        } catch (error: any) {
            console.error('Error:', error)
            console.error('Checkout error:', error);
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-foreground mb-3">
                        Assine o ZapBroker
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Escolha seu plano e comece agora mesmo
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* Left Column - Form */}
                    <div className="space-y-6">
                        {/* Plan Selection */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Selecione seu Plano
                            </h2>
                            <div className="space-y-3">
                                {PLANS.map((plan) => (
                                    <label
                                        key={plan.id}
                                        className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 ${selectedPlanId === plan.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="plan"
                                            value={plan.id}
                                            checked={selectedPlanId === plan.id}
                                            onChange={(e) => setSelectedPlanId(e.target.value)}
                                            className="mt-1"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-foreground flex items-center gap-2">
                                                        {plan.name}
                                                        {plan.popular && (
                                                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                                                Popular
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                                </div>
                                                <p className="text-2xl font-black text-foreground">
                                                    R$ {plan.price.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Checkout Section */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Checkout Seguro
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Você será redirecionado para a plataforma da AbacatePay para realizar seu pagamento via PIX com total segurança.
                            </p>

                            <button
                                onClick={() => {
                                    setLoading(true);
                                    window.location.href = `/checkout/redirect?planId=${selectedPlanId}`;
                                }}
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5" />
                                        Ir para o Pagamento Seguro
                                    </>
                                )}
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Shield className="w-4 h-4" />
                                Pagamento 100% seguro via AbacatePay
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:sticky lg:top-6 h-fit">
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                            <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-foreground">{selectedPlan.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                                    </div>
                                    <p className="font-bold text-foreground">R$ {selectedPlan.price.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="border-t border-border pt-4 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-muted-foreground">Subtotal</p>
                                    <p className="font-medium">R$ {selectedPlan.price.toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <p>Total</p>
                                    <p className="text-primary">R$ {selectedPlan.price.toFixed(2)}/mês</p>
                                </div>
                            </div>

                            <div className="bg-accent/50 rounded-xl p-4 mb-6">
                                <p className="text-sm font-bold mb-3">O que está incluído:</p>
                                <ul className="space-y-2">
                                    {selectedPlan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-2 text-xs text-muted-foreground">
                                <p className="flex items-start gap-2">
                                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    Cancele quando quiser
                                </p>
                                <p className="flex items-start gap-2">
                                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    Suporte em português
                                </p>
                                <p className="flex items-start gap-2">
                                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    Atualizações gratuitas
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {pixData && subscriptionId && (
                <PixQRCodeModal
                    pixData={pixData}
                    subscriptionId={subscriptionId}
                    onClose={() => {
                        setPixData(null)
                        setSubscriptionId(null)
                    }}
                />
            )}
        </div>
    )
}
