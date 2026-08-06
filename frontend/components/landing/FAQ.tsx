"use client"

import { useState } from "react"
import { Plus, Minus, MessageCircle } from "lucide-react"
import Link from "next/link"

const QUESTIONS = [
    {
        q: "O ZapBroker é seguro? Vou ser banido?",
        a: "Você conecta seu próprio número via QR Code, do mesmo jeito que conecta no WhatsApp Web. Recomendamos seguir as boas práticas de envio (não disparar volumes muito grandes de uma vez) pra reduzir o risco de bloqueio pela própria Meta."
    },
    {
        q: "A IA realmente personaliza as mensagens?",
        a: "Sim. O agente guarda o histórico de cada lead — se já perguntou preço, pediu fotos, visitou — e usa isso pra ajudar você a escrever mensagens e lembretes sob medida pra cada um."
    },
    {
        q: "Preciso de conhecimento técnico?",
        a: "Zero. Se você sabe usar WhatsApp, sabe usar ZapBroker. O setup leva menos de 5 minutos: escaneia QR Code, importa contatos e começa a disparar."
    },
    {
        q: "Como funciona o pagamento via PIX?",
        a: "Sua assinatura é cobrada mensalmente via PIX. Você recebe o QR Code direto no painel alguns dias antes do vencimento e paga em segundos, sem cartão de crédito."
    },
    {
        q: "Posso cancelar quando quiser?",
        a: "Sim, sem multas e sem burocracia. Você pode cancelar sua assinatura a qualquer momento diretamente no painel de controle."
    },
    {
        q: "Quanto tempo leva para ativar?",
        a: "Menos de 2 minutos. Você escaneia o QR Code, conecta seu número e já pode criar seu primeiro disparo."
    },
]

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section id="faq" className="py-10 md:py-14 bg-white">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="text-center mb-8">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Dúvidas frequentes</p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Tire suas dúvidas
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5 items-start">
                    {QUESTIONS.map((item, i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-[#f8f7fc] border border-border overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => setOpenIndex(prev => prev === i ? null : i)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <span className="font-bold text-sm text-foreground">{item.q}</span>
                                {openIndex === i ? (
                                    <Minus className="w-3.5 h-3.5 text-primary shrink-0 ml-3" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-3" />
                                )}
                            </button>

                            {openIndex === i && (
                                <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed animate-in slide-in-from-top-2">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-6">
                    <Link
                        href="https://wa.me/5551980985330?text=Olá,%20tenho%20uma%20dúvida%20sobre%20o%20ZapBroker"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm font-medium text-foreground/80 hover:bg-primary/10 transition-colors"
                    >
                        Ainda tem dúvidas? Fale com nosso suporte no WhatsApp <MessageCircle className="w-4 h-4 text-primary" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
