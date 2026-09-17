import type { Metadata } from "next"
import { ArrowUpRight, MessageCircle, Sparkles, Star } from "lucide-react"
import { WHATSAPP_CTA_URL } from "@/components/landing/lp/constants"
import { BrandIcon } from "@/components/BrandLogo"
import { BioLinks } from "@/components/bio/BioLinks"

export const metadata: Metadata = {
    title: "ZapBroker — Links",
    description: "Disparo em massa no WhatsApp feito pra corretor de imóveis. Assine, fale no WhatsApp ou veja como funciona.",
    robots: { index: false, follow: false },
}

const LINKS = [
    {
        href: "/assinar",
        icon: <Sparkles className="w-5 h-5 shrink-0" />,
        title: "Ver planos e assinar",
        desc: "Free, Starter (R$39) ou Pro (R$79) — cartão ou PIX",
        primary: true,
    },
    {
        href: WHATSAPP_CTA_URL,
        icon: <MessageCircle className="w-5 h-5 shrink-0" />,
        title: "Falar agora no WhatsApp",
        desc: "Tira dúvida direto com a gente",
        primary: false,
        external: true,
    },
    {
        href: "/",
        icon: <ArrowUpRight className="w-5 h-5 shrink-0" />,
        title: "Ver como funciona",
        desc: "A página completa, com tudo explicado",
        primary: false,
    },
]

export default function BioPage() {
    return (
        <div className="min-h-screen landing-sky-gradient flex flex-col items-center px-5 py-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-5">
                <BrandIcon className="h-9 text-white" monochrome />
            </div>

            <h1 className="font-display text-2xl font-extrabold text-white mb-1.5">ZapBroker</h1>
            <p className="text-sm text-white/70 mb-8 max-w-xs leading-relaxed">
                Disparo em massa no WhatsApp feito pra corretor de imóveis. Manda mensagem pra toda sua base sem perder lead pelo caminho.
            </p>

            <BioLinks links={LINKS} />

            <div className="flex items-center gap-1.5 text-white/60 text-xs font-medium">
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 fill-landing-lime text-landing-lime" />
                    ))}
                </div>
                +2.500 corretores já usam o ZapBroker
            </div>
        </div>
    )
}
