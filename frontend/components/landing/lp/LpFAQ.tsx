"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

const QUESTIONS = [
    {
        q: "Vou ser banido do WhatsApp?",
        a: "Você conecta seu próprio número, do mesmo jeito que no WhatsApp Web. Seguindo as boas práticas de envio, o risco de bloqueio é baixo.",
    },
    {
        q: "Preciso trocar de número ou app?",
        a: "Não. Continua sendo o seu WhatsApp, no seu número. O ZapBroker só organiza o disparo pra sua lista.",
    },
    {
        q: "Preciso de conhecimento técnico?",
        a: "Zero. Se você sabe usar WhatsApp, sabe usar o ZapBroker. Setup em menos de 5 minutos.",
    },
    {
        q: "Como funciona o pagamento?",
        a: "Assinatura mensal via PIX, sem cartão de crédito, cancele quando quiser direto no painel.",
    },
]

export function LpFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section className="py-14 md:py-18 bg-landing-mist">
            <div className="container mx-auto px-4 md:px-6 max-w-2xl">
                <div className="text-center mb-8">
                    <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-landing-navy">
                        Dúvidas rápidas
                    </h2>
                </div>

                <div className="space-y-2.5">
                    {QUESTIONS.map((item, i) => (
                        <div key={i} className="rounded-2xl bg-white border border-landing-navy/10 overflow-hidden">
                            <button
                                onClick={() => setOpenIndex((prev) => (prev === i ? null : i))}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <span className="font-bold text-sm text-landing-navy">{item.q}</span>
                                {openIndex === i ? (
                                    <Minus className="w-3.5 h-3.5 text-landing-sky shrink-0 ml-3" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5 text-landing-navy/40 shrink-0 ml-3" />
                                )}
                            </button>
                            {openIndex === i && (
                                <div className="px-4 pb-4 text-landing-navy/60 text-sm leading-relaxed animate-in slide-in-from-top-2">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
