"use client"

import Link from 'next/link'
import { Clock, CreditCard, Smartphone, Star, ArrowUpRight } from 'lucide-react'
import { WhatsAppMockup } from './WhatsAppMockup'

const AVATAR_COLORS = ['bg-primary/20', 'bg-indigo-200', 'bg-primary/30', 'bg-indigo-300']

export function Hero() {
    return (
        <section className="relative overflow-hidden landing-sky-gradient pt-14 pb-8 md:pt-20">
            <div className="container relative mx-auto px-4 md:px-6 text-center">
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 text-white leading-[1.05] text-balance max-w-4xl mx-auto">
                    Cada mensagem que você atrasa<br className="hidden md:block" /> vira uma <span className="text-landing-lime">venda</span> perdida.
                </h1>

                <p className="text-base md:text-lg text-white/70 mb-8 leading-relaxed max-w-xl mx-auto">
                    O ZapBroker envia campanhas no automático, acompanha quem não respondeu e sugere lembretes. Você aprova tudo em um clique.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                    <Link
                        href="/login"
                        className="group flex items-center gap-2 pl-6 pr-2.5 py-2.5 bg-landing-lime hover:bg-landing-lime-dark text-landing-navy rounded-full font-bold text-sm transition-colors"
                    >
                        Assinar agora
                        <span className="flex items-center justify-center size-7 rounded-full bg-landing-navy text-landing-lime group-hover:rotate-45 transition-transform">
                            <ArrowUpRight className="size-4" />
                        </span>
                    </Link>
                    <Link
                        href="#pricing"
                        className="px-6 py-3 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full font-semibold text-sm transition-colors"
                    >
                        Ver planos
                    </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/80">
                        <Clock className="w-3.5 h-3.5 text-landing-lime" /> Ativação em 2 minutos
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/80">
                        <CreditCard className="w-3.5 h-3.5 text-landing-lime" /> Pagamento via PIX
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/80">
                        <Smartphone className="w-3.5 h-3.5 text-landing-lime" /> Continua no seu número
                    </div>
                </div>
            </div>

            {/* Composição flutuante — mockups reais em cartões inclinados, não um único bloco centralizado */}
            <div className="relative mt-6 md:mt-10 h-[280px] sm:h-[340px] md:h-[420px] max-w-5xl mx-auto px-4">
                <div className="hidden md:block absolute left-[6%] top-4 w-52 rotate-[-8deg] hover:rotate-0 transition-transform duration-300">
                    <div className="rounded-2xl bg-white shadow-2xl shadow-black/30 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-landing-navy/50 mb-2">Disparo de hoje</p>
                        <p className="text-2xl font-display font-bold text-landing-navy">98%</p>
                        <p className="text-xs text-landing-navy/60">taxa de entrega</p>
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[260px] sm:w-[300px] rotate-[-3deg] hover:rotate-0 transition-transform duration-300 z-10">
                    <WhatsAppMockup />
                </div>

                <div className="hidden md:flex absolute right-[6%] top-10 w-56 rotate-[7deg] hover:rotate-0 transition-transform duration-300 items-center gap-3 rounded-2xl bg-white shadow-2xl shadow-black/30 p-4">
                    <div className="flex -space-x-2 shrink-0">
                        {AVATAR_COLORS.map((color, i) => (
                            <div key={i} className={`w-7 h-7 rounded-full border-2 border-white ${color}`} />
                        ))}
                    </div>
                    <div className="text-xs">
                        <p className="font-bold text-landing-navy">+2.500 corretores</p>
                        <div className="flex items-center gap-0.5 text-landing-navy/60">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-landing-lime-dark text-landing-lime-dark" />)}
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block absolute right-[14%] bottom-0 w-44 rotate-[4deg] hover:rotate-0 transition-transform duration-300">
                    <div className="rounded-2xl bg-landing-navy text-white shadow-2xl shadow-black/30 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">Sem digitar nada</p>
                        <p className="text-sm font-semibold leading-snug">O agente escreve, você só aprova.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
