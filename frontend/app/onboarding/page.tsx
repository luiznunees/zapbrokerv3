"use client"
import { useState } from 'react'
import { ArrowRight, Building2, User, Target, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [role, setRole] = useState<'agent' | 'agency' | null>(null)

    const handleNext = () => setStep(s => s + 1)
    const handleFinish = () => router.push('/dashboard')

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Progress Bar */}
                <div className="flex gap-2 mb-12">
                    <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 1 ? "bg-primary" : "bg-border")} />
                    <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-border")} />
                    <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 3 ? "bg-primary" : "bg-border")} />
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
                                <input type="range" min="1" max="50" defaultValue="5" className="w-full accent-primary h-2 bg-border rounded-lg appearance-none cursor-pointer" />
                                <div className="flex justify-between text-muted-foreground font-medium">
                                    <span>R$ 1M</span>
                                    <span className="text-primary font-bold text-xl">R$ 5 Milhões / mês</span>
                                    <span>R$ 50M+</span>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-end">
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-all"
                                >
                                    Definir Meta <Target className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-300 text-center">
                            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10" />
                            </div>
                            <h1 className="text-3xl font-bold mb-4">Tudo pronto!</h1>
                            <p className="text-muted-foreground mb-8 text-lg">Sua máquina de vendas foi configurada com sucesso.</p>

                            <button
                                onClick={handleFinish}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                            >
                                Acessar Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
