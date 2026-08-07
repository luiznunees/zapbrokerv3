"use client"

import { X, Share, SquarePlus } from "lucide-react"

// iOS Safari não dispara beforeinstallprompt — só dá pra instalar manualmente via
// Compartilhar > Adicionar à Tela de Início. Esse modal explica o passo a passo.
const STEPS = [
    {
        icon: Share,
        title: "Toque em Compartilhar",
        description: "O ícone de quadrado com uma seta pra cima, na barra do Safari.",
    },
    {
        icon: SquarePlus,
        title: "Adicionar à Tela de Início",
        description: "Role a lista de opções até encontrar essa e toque nela.",
    },
]

export function InstallAppModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="size-5" />
                </button>

                <h2 className="text-lg font-bold text-foreground mb-1">Instalar o ZapBroker</h2>
                <p className="text-sm text-muted-foreground mb-5">No iPhone, a instalação é manual pelo Safari — leva só alguns segundos.</p>

                <div className="space-y-4">
                    {STEPS.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="flex items-center justify-center size-9 rounded-xl bg-primary/10 text-primary shrink-0 font-bold text-sm">
                                {i + 1}
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                    <step.icon className="size-3.5" /> {step.title}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    Entendi
                </button>
            </div>
        </div>
    )
}
