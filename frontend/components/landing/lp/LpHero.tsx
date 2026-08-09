import Link from "next/link"
import { ArrowUpRight, Clock, CreditCard, Smartphone } from "lucide-react"
import { WhatsAppMockup } from "@/components/landing/WhatsAppMockup"
import { WHATSAPP_CTA_URL } from "./constants"

export function LpHero() {
    return (
        <section className="relative overflow-hidden landing-sky-gradient pt-10 pb-10 md:pt-16">
            <div className="container relative mx-auto px-4 md:px-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-landing-lime mb-5">
                    Feito para corretores e imobiliárias
                </div>

                <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-5 text-white leading-[1.05] text-balance max-w-3xl mx-auto">
                    Cada lead que demora a receber resposta é uma venda indo pro corretor concorrente.
                </h1>

                <p className="text-base md:text-lg text-white/70 mb-8 leading-relaxed max-w-xl mx-auto">
                    O ZapBroker dispara sua campanha pra toda a carteira de uma vez e mostra quem ainda não respondeu, pra você reativar com um clique — direto no seu WhatsApp, sem trocar de chip.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                    <Link
                        href={WHATSAPP_CTA_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 pl-6 pr-2.5 py-3 bg-landing-lime hover:bg-landing-lime-dark text-landing-navy rounded-full font-bold text-sm transition-colors"
                    >
                        Falar agora no WhatsApp
                        <span className="flex items-center justify-center size-7 rounded-full bg-landing-navy text-landing-lime group-hover:rotate-45 transition-transform">
                            <ArrowUpRight className="size-4" />
                        </span>
                    </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/80">
                        <Clock className="w-3.5 h-3.5 text-landing-lime" /> Ativação em 2 minutos
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/80">
                        <Smartphone className="w-3.5 h-3.5 text-landing-lime" /> Continua no seu número
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/80">
                        <CreditCard className="w-3.5 h-3.5 text-landing-lime" /> Pagamento via PIX
                    </div>
                </div>
            </div>

            <div className="relative mt-8 md:mt-10 max-w-sm mx-auto px-4">
                <div className="rotate-[-2deg]">
                    <WhatsAppMockup />
                </div>
            </div>
        </section>
    )
}
