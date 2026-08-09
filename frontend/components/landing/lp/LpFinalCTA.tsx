import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { WHATSAPP_CTA_URL } from "./constants"

export function LpFinalCTA() {
    return (
        <section className="py-8 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="relative rounded-3xl landing-sky-gradient p-8 md:p-10 overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-white text-center md:text-left leading-tight max-w-md text-balance">
                            Chega de lead esfriando no WhatsApp. Ative em 2 minutos.
                        </h2>

                        <Link
                            href={WHATSAPP_CTA_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group shrink-0 flex items-center gap-2 pl-8 pr-2.5 py-3.5 bg-landing-lime hover:bg-landing-lime-dark text-landing-navy rounded-full font-black text-sm transition-colors"
                        >
                            Falar no WhatsApp
                            <span className="flex items-center justify-center size-8 rounded-full bg-landing-navy text-landing-lime group-hover:rotate-45 transition-transform">
                                <ArrowUpRight className="size-4" />
                            </span>
                        </Link>
                    </div>

                    <p className="relative z-10 text-xs text-white/70 text-center md:text-left mt-5">
                        Ativação imediata &nbsp;•&nbsp; Pagamento via PIX &nbsp;•&nbsp; Cancele quando quiser
                    </p>
                </div>
            </div>
        </section>
    )
}
