"use client"

import { useState } from "react"
import { Building2, User, MapPin, Smartphone, MessageCircleHeart, Target, ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type ChipPurpose = "pessoal" | "profissional" | "leads"

const CHIP_PURPOSE_LABELS: Record<ChipPurpose, string> = {
    pessoal: "Uso pessoal",
    profissional: "Uso profissional (não leads ainda)",
    leads: "Já uso pra responder leads",
}

const VGV_OPTIONS = [
    { value: 3, label: "Até R$ 3M/mês" },
    { value: 10, label: "R$ 3-15M/mês" },
    { value: 25, label: "R$ 15-30M/mês" },
    { value: 40, label: "Mais de R$ 30M/mês" },
]

export type OnboardingResult = {
    onboarding_steps: { role: "agent" | "agency"; vgvGoal: number; completed: true }
    broker_context: {
        city: string | null
        chipCount: 1 | 2 | 3
        chipPurposes: ChipPurpose[]
        wantsListingReferrals: boolean
    }
}

interface ChatOnboardingBriefingProps {
    onComplete: (result: OnboardingResult) => void
    disabled?: boolean
}

const TOTAL_STEPS = 6

// Roda dentro de uma bolha de mensagem do agente (mesmo lugar que ChatListPicker,
// ChatTimingConfirm etc.) — é o próprio bot "aplicando o formulário" na conversa,
// em vez de mandar o usuário pra uma página de wizard separada.
export function ChatOnboardingBriefing({ onComplete, disabled }: ChatOnboardingBriefingProps) {
    const [step, setStep] = useState(1)
    const [role, setRole] = useState<"agent" | "agency" | null>(null)
    const [vgvGoal, setVgvGoal] = useState<number | null>(null)
    const [city, setCity] = useState("")
    const [chipCount, setChipCount] = useState<1 | 2 | 3 | null>(null)
    const [chipPurposes, setChipPurposes] = useState<ChipPurpose[]>([])
    const [wantsListingReferrals, setWantsListingReferrals] = useState<boolean | null>(null)
    const [done, setDone] = useState(false)

    const setChipPurposeAt = (index: number, purpose: ChipPurpose) => {
        setChipPurposes((prev) => {
            const next = [...prev]
            next[index] = purpose
            return next
        })
    }

    const finish = (finalWantsReferrals: boolean) => {
        setWantsListingReferrals(finalWantsReferrals)
        setDone(true)
        onComplete({
            onboarding_steps: { role: role!, vgvGoal: vgvGoal ?? 5, completed: true },
            broker_context: {
                city: city.trim() || null,
                chipCount: chipCount!,
                chipPurposes,
                wantsListingReferrals: finalWantsReferrals,
            },
        })
    }

    if (done) {
        return (
            <div className="mt-2 w-full max-w-sm rounded-2xl border border-border glass p-4 flex items-center gap-2.5 text-sm text-foreground">
                <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="size-4" />
                </div>
                Perfil salvo — já uso isso pra te ajudar melhor daqui pra frente.
            </div>
        )
    }

    return (
        <div className="mt-2 w-full max-w-sm rounded-2xl border border-border glass p-4 space-y-4">
            <div className="flex gap-1.5">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", step >= i + 1 ? "bg-purple-500" : "bg-border")} />
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Como você atua hoje?</p>
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            disabled={disabled}
                            onClick={() => { setRole("agent"); setStep(2) }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-purple-500 text-left transition-all disabled:opacity-50"
                        >
                            <User className="size-4 text-purple-500 shrink-0" />
                            <span className="text-sm">Corretor autônomo</span>
                        </button>
                        <button
                            disabled={disabled}
                            onClick={() => { setRole("agency"); setStep(2) }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-purple-500 text-left transition-all disabled:opacity-50"
                        >
                            <Building2 className="size-4 text-purple-500 shrink-0" />
                            <span className="text-sm">Imobiliária / equipe</span>
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <MapPin className="size-4 text-purple-500" /> Em que cidade/região você atua?
                    </div>
                    <input
                        autoFocus
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: Capão da Canoa, RS"
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                    <button
                        disabled={disabled}
                        onClick={() => setStep(3)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        Continuar <ArrowRight className="size-4" />
                    </button>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Smartphone className="size-4 text-purple-500" /> Quantos números de WhatsApp você usa hoje?
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((n) => (
                            <button
                                key={n}
                                disabled={disabled}
                                onClick={() => {
                                    setChipCount(n as 1 | 2 | 3)
                                    setChipPurposes(Array.from({ length: n }, (_, i) => chipPurposes[i] || "leads"))
                                    setStep(4)
                                }}
                                className="p-3 rounded-xl border border-border hover:border-purple-500 text-center font-bold text-lg transition-all disabled:opacity-50"
                            >
                                {n}{n === 3 ? "+" : ""}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Pra que você usa {chipCount === 1 ? "esse número" : "cada número"}?</p>
                    {Array.from({ length: chipCount || 1 }, (_, i) => (
                        <div key={i} className="space-y-1.5">
                            {(chipCount || 1) > 1 && <p className="text-xs font-medium text-muted-foreground">Número {i + 1}</p>}
                            <div className="grid grid-cols-1 gap-1.5">
                                {(Object.keys(CHIP_PURPOSE_LABELS) as ChipPurpose[]).map((purpose) => (
                                    <button
                                        key={purpose}
                                        disabled={disabled}
                                        onClick={() => setChipPurposeAt(i, purpose)}
                                        className={cn(
                                            "p-2.5 rounded-lg border text-xs font-medium text-left transition-all disabled:opacity-50",
                                            chipPurposes[i] === purpose ? "border-purple-500 bg-purple-500/5 text-purple-600" : "border-border hover:border-purple-500"
                                        )}
                                    >
                                        {CHIP_PURPOSE_LABELS[purpose]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button
                        disabled={disabled || chipPurposes.length < (chipCount || 1)}
                        onClick={() => setStep(5)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        Continuar <ArrowRight className="size-4" />
                    </button>
                </div>
            )}

            {step === 5 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Target className="size-4 text-purple-500" /> Qual sua meta de VGV por mês?
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                        {VGV_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                disabled={disabled}
                                onClick={() => { setVgvGoal(opt.value); setStep(6) }}
                                className="p-2.5 rounded-lg border border-border hover:border-purple-500 text-xs font-medium text-left transition-all disabled:opacity-50"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 6 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <MessageCircleHeart className="size-4 text-purple-500" /> Quer receber indicação de listagens (quando disponível na sua região)?
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                        <button
                            disabled={disabled}
                            onClick={() => finish(true)}
                            className="p-2.5 rounded-lg border border-border hover:border-purple-500 text-xs font-medium text-left transition-all disabled:opacity-50"
                        >
                            Quero sim
                        </button>
                        <button
                            disabled={disabled}
                            onClick={() => finish(false)}
                            className="p-2.5 rounded-lg border border-border hover:border-purple-500 text-xs font-medium text-left transition-all disabled:opacity-50"
                        >
                            Não, prefiro não receber por enquanto
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
