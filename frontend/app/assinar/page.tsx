"use client"

import Link from 'next/link'
import { Check } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BrandLogo } from '@/components/BrandLogo'
import { PLAN_INFO } from '@/lib/plans'
import { AUTH_PAGE_BG, AUTH_GRADIENT } from '@/components/auth/AuthFormControls'
import { logoutUser } from '@/lib/supabase'

const PLAN_IDS = ['starter', 'pro'] as const

function handleLogout() {
    logoutUser()
}

export default function AssinarPage() {
    return (
        <ProtectedRoute>
            <div className={`min-h-screen w-full ${AUTH_PAGE_BG}`}>
                <header className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
                    <BrandLogo className="h-7 w-auto" />
                    <button onClick={handleLogout} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Sair
                    </button>
                </header>

                <div className="max-w-4xl mx-auto px-6 pb-16 pt-4 text-center">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Escolha um plano para continuar
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
                        Sua conta está criada, mas ainda não tem uma assinatura ativa. Escolha um plano abaixo pra liberar o painel.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto items-start mt-8 text-left">
                        {PLAN_IDS.map((id, i) => {
                            const plan = PLAN_INFO[id]
                            const featured = i === 1
                            return (
                                <div
                                    key={id}
                                    className={`relative p-6 rounded-3xl transition-transform hover:-translate-y-1 ${featured
                                        ? `text-white shadow-xl ${AUTH_GRADIENT}`
                                        : 'bg-white border border-border text-foreground'
                                        }`}
                                >
                                    {featured && (
                                        <div className="absolute -top-3 right-6 bg-white text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
                                            Mais Escolhido
                                        </div>
                                    )}

                                    <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${featured ? 'text-white/60' : 'text-muted-foreground'}`}>
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-sm font-bold ${featured ? 'text-white/60' : 'text-muted-foreground'}`}>R$</span>
                                        <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                                        <span className={`text-sm ${featured ? 'text-white/60' : 'text-muted-foreground'}`}>/mês</span>
                                    </div>
                                    <p className={`text-xs mt-1 mb-5 ${featured ? 'text-white/60' : 'text-muted-foreground'}`}>Mensal via PIX, cancele quando quiser</p>

                                    <ul className="space-y-2.5 mb-6">
                                        {plan.features.map((feature, j) => (
                                            <li key={j} className="flex items-start gap-2.5 text-sm">
                                                <Check className={`w-4 h-4 shrink-0 mt-0.5 ${featured ? 'text-white' : 'text-primary'}`} />
                                                <span className={featured ? 'text-white/90' : 'text-foreground/80'}>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={`/checkout/redirect?planId=${id}`}
                                        className={`w-full py-3 rounded-full font-black text-sm text-center transition-colors block ${featured
                                            ? 'bg-white hover:bg-white/90 text-primary'
                                            : 'border-2 border-primary text-primary hover:bg-primary/5'
                                            }`}
                                    >
                                        Assinar {plan.name}
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
