"use client"

import { useState } from "react"
import { Plus, Minus, MessageCircle } from "lucide-react"
import Link from "next/link"
import { FAQ_ITEMS } from "./faqData"

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section id="faq" className="py-14 md:py-18 bg-landing-mist">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="text-center mb-8">
                    <p className="text-xs font-bold text-landing-sky uppercase tracking-widest mb-2">Dúvidas frequentes</p>
                    <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-landing-navy">
                        Tire suas dúvidas
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5 items-start">
                    {FAQ_ITEMS.map((item, i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-white border border-landing-navy/10 overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => setOpenIndex(prev => prev === i ? null : i)}
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

                <div className="flex justify-center mt-6">
                    <Link
                        href="https://wa.me/5551994851661?text=Olá,%20tenho%20uma%20dúvida%20sobre%20o%20ZapBroker"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-landing-navy/10 text-sm font-medium text-landing-navy/80 hover:bg-landing-navy/5 transition-colors"
                    >
                        Ainda tem dúvidas? Fale com nosso suporte no WhatsApp <MessageCircle className="w-4 h-4 text-landing-sky" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
