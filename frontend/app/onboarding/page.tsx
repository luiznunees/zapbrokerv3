"use client"
import { useState } from 'react'
import { ArrowRight, Building2, User, Target, Check, MapPin, Smartphone, MessageCircleHeart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { api } from '@/services/api'

type ChipPurpose = 'pessoal' | 'profissional' | 'leads'

const CHIP_PURPOSE_LABELS: Record<ChipPurpose, string> = {
    pessoal: 'Uso pessoal',
    profissional: 'Uso profissional (não leads ainda)',
    leads: 'Já uso pra responder leads',
}

const TOTAL_STEPS = 6

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [role, setRole] = useState<'agent' | 'agency' | null>(null)
    const [vgvGoal, setVgvGoal] = useState(5)
    const [city, setCity] = useState('')
    const [chipCount, setChipCount] = useState<1 | 2 | 3 | null>(null)
    const [chipPurposes, setChipPurposes] = useState<ChipPurpose[]>([])
    const [wantsListingReferrals, setWantsListingReferrals] = useState<boolean | null>(null)
    const [saving, setSaving] = useState(false)

    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => setStep(s => Math.max(1, s - 1))

    const setChipPurposeAt = (index: number, purpose: ChipPurpose) => {
        setChipPurposes(prev => {
            const next = [...prev]
            next[index] = purpose
            return next
        })
    }

    const handleFinish = async () => {
        setSaving(true)
        try {
            await api.auth.updateProfile({
                onboarding_steps: { role, vgvGoal, completed: true },
                broker_context: {
                    city: city.trim() || null,
                    chipCount,
                    chipPurposes,
                    wantsListingReferrals,
                },
            })
        } catch { }
        router.push('/dashboard')
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Progress Bar */}
                <div className="flex gap-2 mb-12">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= i + 1 ? "bg-primary" : "bg-border")} />
                    ))}
                </div>

                <div className="bg-card border border-border rounded-2xl p-10 shadow-2xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                            <h1 className="text-3xl font-bold mb-4">Como você atua hoje?</h1>
                            <p className="text-muted-foreground mb-8 text-lg">Para personalizar sua experiência, precisamos saber seu perfil.</p>

                            <div className="grid md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setRole('agent')}
                                    className={cn(
                                        "p-6 rounded-xl border-2 text-left transition-all hover:border-primary",
                                        role === 'agent' ? "border-primary bg-primary/5" : "border-border"
                                    )}
                                >
                                    <User className={cn("w-8 h-8 mb-4", role === 'agent' ? "text-primary" : "text-muted-foreground")} />
                                    <h3 className="font-bold text-lg mb-2">Corretor Autônomo</h3>
                                    <p className="text-sm text-muted-foreground">Trabalho sozinho e quero organizar meus próprios leads.</p>
                                </button>

                                <button
                                    onClick={() => setRole('agency')}
                                    className={cn(
                                        "p-6 rounded-xl border-2 text-left transition-all hover:border-primary",
                                        role === 'agency' ? "border-primary bg-primary/5" : "border-border"
                                    )}
                                >
                                    <Building2 className={cn("w-8 h-8 mb-4", role === 'agency' ? "text-primary" : "text-muted-foreground")} />
                                    <h3 className="font-bold text-lg mb-2">Imobiliária / Equipe</h3>
                                    <p className="text-sm text-muted-foreground">Tenho uma equipe e preciso distribuir leads.</p>
                                </button>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleNext}
                                    disabled={!role}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Continuar <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                            <h1 className="text-3xl font-bold mb-4">Qual sua meta de VGV?</h1>
                            <p className="text-muted-foreground mb-8 text-lg">Vamos ajustar o algoritmo para te ajudar a chegar lá.</p>

                            <div className="space-y-4">
                                <input type="range" min="1" max="50" value={vgvGoal} onChange={e => setVgvGoal(Number(e.target.value))} className="w-full accent-primary h-2 bg-border rounded-lg appearance-none cursor-pointer" />
                                <div className="flex justify-between text-muted-foreground font-medium">
                                    <span>R$ 1M</span>
                                    <span className="text-primary font-bold text-xl">R$ {vgvGoal} Milhões / mês</span>
                                    <span>R$ 50M+</span>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-between">
                                <button onClick={handleBack} className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors">
                                    Voltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all"
                                >
                                    Continuar <Target className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                            <MapPin className="w-8 h-8 mb-4 text-primary" />
                            <h1 className="text-3xl font-bold mb-4">Em que cidade/região você atua?</h1>
                            <p className="text-muted-foreground mb-8 text-lg">Isso ajuda o agente a te dar sugestões mais relevantes pro seu mercado.</p>

                            <input
                                type="text"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder="Ex: Capão da Canoa, RS"
                                className="w-full p-4 rounded-xl border-2 border-border bg-background focus:border-primary outline-none text-lg"
                            />

                            <div className="mt-12 flex justify-between">
                                <button onClick={handleBack} className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors">
                                    Voltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all"
                                >
                                    Continuar <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                            <Smartphone className="w-8 h-8 mb-4 text-primary" />
                            <h1 className="text-3xl font-bold mb-4">Quantos números de WhatsApp você usa hoje?</h1>
                            <p className="text-muted-foreground mb-8 text-lg">Com mais de um número, dá pra dividir o disparo e reduzir o risco de bloqueio.</p>

                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => {
                                            setChipCount(n as 1 | 2 | 3)
                                            setChipPurposes(prev => Array.from({ length: n }, (_, i) => prev[i] || 'leads'))
                                        }}
                                        className={cn(
                                            "p-6 rounded-xl border-2 text-center font-bold text-2xl transition-all hover:border-primary",
                                            chipCount === n ? "border-primary bg-primary/5 text-primary" : "border-border"
                                        )}
                                    >
                                        {n}{n === 3 ? '+' : ''}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-12 flex justify-between">
                                <button onClick={handleBack} className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors">
                                    Voltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!chipCount}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Continuar <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                            <h1 className="text-3xl font-bold mb-4">Pra que você usa {chipCount === 1 ? 'esse número' : 'cada número'}?</h1>
                            <p className="text-muted-foreground mb-8 text-lg">Assim o agente sabe se algum já está sendo usado pra responder lead.</p>

                            <div className="space-y-4">
                                {Array.from({ length: chipCount || 1 }, (_, i) => (
                                    <div key={i}>
                                        <p className="text-sm font-bold mb-2 text-muted-foreground">Número {i + 1}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            {(Object.keys(CHIP_PURPOSE_LABELS) as ChipPurpose[]).map(purpose => (
                                                <button
                                                    key={purpose}
                                                    onClick={() => setChipPurposeAt(i, purpose)}
                                                    className={cn(
                                                        "p-3 rounded-lg border-2 text-sm font-medium transition-all hover:border-primary text-left",
                                                        chipPurposes[i] === purpose ? "border-primary bg-primary/5 text-primary" : "border-border"
                                                    )}
                                                >
                                                    {CHIP_PURPOSE_LABELS[purpose]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 flex justify-between">
                                <button onClick={handleBack} className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors">
                                    Voltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all"
                                >
                                    Continuar <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-300 text-center">
                            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10" />
                            </div>
                            <h1 className="text-3xl font-bold mb-4">Tudo pronto!</h1>
                            <p className="text-muted-foreground mb-6 text-lg">Sua máquina de vendas foi configurada com sucesso.</p>

                            <button
                                onClick={() => setWantsListingReferrals(prev => prev === null ? true : prev)}
                                className={cn(
                                    "w-full p-4 rounded-xl border-2 text-left mb-3 transition-all hover:border-primary flex items-center gap-3",
                                    wantsListingReferrals === true ? "border-primary bg-primary/5" : "border-border"
                                )}
                            >
                                <MessageCircleHeart className={cn("w-6 h-6 shrink-0", wantsListingReferrals === true ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-sm">Quero receber indicação de listagens de condomínio (ex: litoral norte do RS) quando disponível</span>
                            </button>
                            <button
                                onClick={() => setWantsListingReferrals(false)}
                                className={cn(
                                    "w-full p-4 rounded-xl border-2 text-left mb-8 transition-all hover:border-primary",
                                    wantsListingReferrals === false ? "border-primary bg-primary/5" : "border-border"
                                )}
                            >
                                <span className="text-sm text-muted-foreground">Não, prefiro não receber por enquanto</span>
                            </button>

                            <button
                                onClick={handleFinish}
                                disabled={saving}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-xl hover:bg-primary/90 disabled:opacity-60 transition-all shadow-xl shadow-primary/20"
                            >
                                {saving ? 'Salvando...' : 'Acessar Dashboard'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
