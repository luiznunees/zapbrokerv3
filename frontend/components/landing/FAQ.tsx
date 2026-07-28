"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

const QUESTIONS = [
    {
        q: "O ZapBroker é seguro? Vou ser banido?",
        a: "Você conecta seu próprio número via QR Code, do mesmo jeito que conecta no WhatsApp Web. Recomendamos seguir as boas práticas de envio (não disparar volumes muito grandes de uma vez) pra reduzir o risco de bloqueio pela própria Meta."
    },
    {
        q: "Preciso de conhecimento técnico?",
        a: "Zero. Se você sabe usar WhatsApp, sabe usar ZapBroker. O setup leva menos de 5 minutos: escaneia QR Code, importa contatos e começa a disparar."
    },
    {
        q: "Posso cancelar quando quiser?",
        a: "Sim, sem multas e sem burocracia. Você pode cancelar sua assinatura a qualquer momento diretamente no painel de controle."
    },
    {
        q: "Funciona no meu celular?",
        a: "Sim. O painel é web responsivo — funciona no navegador do PC ou do celular. E o agente te avisa direto no seu WhatsApp quando um disparo termina ou um lead some, então você não precisa ficar de olho no painel o tempo todo."
    },
    {
        q: "A IA realmente personaliza as mensagens?",
        a: "Sim. O agente guarda o histórico de cada lead — se já perguntou preço, pediu fotos, visitou — e usa isso pra ajudar você a escrever mensagens e lembretes sob medida pra cada um."
    }
]

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section id="faq" className="py-10 md:py-14 bg-white">
            <div className="container mx-auto px-4 md:px-6 max-w-xl">
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2 text-[#0a0a0a] uppercase">
                        Dúvidas Frequentes
                    </h2>
                </div>

                <div className="space-y-2.5">
                    {QUESTIONS.map((item, i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-[#f6f4f1] overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => setOpenIndex(prev => prev === i ? null : i)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <span className="font-bold text-sm text-[#0a0a0a]">{item.q}</span>
                                {openIndex === i ? (
                                    <Minus className="w-3.5 h-3.5 text-[#145c3b] shrink-0 ml-3" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5 text-[#6f6b76] shrink-0 ml-3" />
                                )}
                            </button>

                            {openIndex === i && (
                                <div className="px-4 pb-4 text-[#6f6b76] text-sm leading-relaxed animate-in slide-in-from-top-2">
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
