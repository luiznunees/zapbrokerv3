"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

const QUESTIONS = [
    {
        q: "O ZapBroker é seguro? Vou ser banido?",
        a: "A segurança é nossa prioridade. Nosso sistema utiliza intervalos de tempo inteligentes e variáveis dinâmicas para simular o comportamento humano, minimizando drasticamente o risco de banimentos quando usado dentro das boas práticas."
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
        a: "O ZapBroker é uma plataforma web responsiva. Você configura as campanhas pelo navegador (PC ou Celular) e o sistema faz os envios na nuvem, mesmo com seu celular desligado."
    },
    {
        q: "A IA realmente personaliza as mensagens?",
        a: "Sim. Nossa IA analisa o perfil do lead (nome, cidade, histórico) e cria mensagens únicas para cada contato, aumentando muito a taxa de resposta."
    }
]

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section id="faq" className="py-8 bg-card/50">
            <div className="container mx-auto px-4 md:px-6 max-w-xl">
                <div className="text-center mb-6">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                        Dúvidas Frequentes
                    </h2>
                </div>

                <div className="space-y-2">
                    {QUESTIONS.map((item, i) => (
                        <div
                            key={i}
                            className="border border-border rounded-lg bg-card overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => setOpenIndex(prev => prev === i ? null : i)}
                                className="w-full flex items-center justify-between p-3 text-left"
                            >
                                <span className="font-bold text-sm">{item.q}</span>
                                {openIndex === i ? (
                                    <Minus className="w-3 h-3 text-brand-purple-500" />
                                ) : (
                                    <Plus className="w-3 h-3 text-muted-foreground" />
                                )}
                            </button>

                            {openIndex === i && (
                                <div className="px-3 pb-3 text-muted-foreground text-xs leading-relaxed animate-in slide-in-from-top-2">
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
