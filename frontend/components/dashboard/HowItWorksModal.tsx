"use client"

import { X, QrCode, MessageSquareText, ListChecks, BellRing } from "lucide-react"

// Mesmos 4 passos e copy de components/landing/Features.tsx — conteúdo estático de
// propósito: precisa continuar funcionando mesmo se o agente de IA travar ou responder
// estranho, já que é exatamente nesse momento que o corretor mais precisa de uma
// explicação simples de como o produto funciona.
const STEPS = [
    {
        icon: QrCode,
        title: "Conecte em 30 segundos",
        description: "Escaneie o QR Code e pronto. Não precisa instalar nada, não precisa trocar de chip.",
    },
    {
        icon: MessageSquareText,
        title: "Fale com o agente",
        description: "Diga o que você quer em linguagem natural. O agente monta o disparo e escreve a mensagem.",
    },
    {
        icon: ListChecks,
        title: "Disparo pra lista inteira",
        description: "Envie pra toda a sua lista de leads de uma vez, imediato ou agendado. Qualquer tamanho de lista.",
    },
    {
        icon: BellRing,
        title: "Acompanhe quem recebeu",
        description: "Veja no seu WhatsApp quantos leads visualizaram e quantos ainda não responderam.",
    },
]

export function HowItWorksModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="size-5" />
                </button>

                <h2 className="text-lg font-bold text-foreground mb-1">Como o ZapBroker funciona</h2>
                <p className="text-sm text-muted-foreground mb-5">Tecnologia de ponta simplificada para você focar no que importa: vender imóveis.</p>

                <div className="space-y-4">
                    {STEPS.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="flex items-center justify-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
                                <step.icon className="size-4" />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
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
