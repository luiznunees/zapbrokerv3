import Link from "next/link"
import { BrandLogo } from "@/components/BrandLogo"
import { ArrowUpRight } from "lucide-react"
import { WHATSAPP_CTA_URL } from "./constants"

// Header enxuto de propósito: sem menu de navegação. Em página de tráfego pago,
// cada link extra é uma saída do funil — o visitante só tem uma decisão a tomar.
export function LpHeader() {
    return (
        <header className="sticky top-0 z-50 w-full bg-landing-navy/95 backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto max-w-5xl px-4 md:px-6">
                <div className="flex items-center justify-between h-16">
                    <BrandLogo className="h-6 w-auto text-white" monochrome />
                    <Link
                        href={WHATSAPP_CTA_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group hidden sm:flex items-center gap-2 pl-5 pr-2 py-2 bg-landing-lime text-landing-navy rounded-full font-bold text-sm hover:bg-landing-lime-dark transition-colors"
                    >
                        Falar no WhatsApp
                        <span className="flex items-center justify-center size-6 rounded-full bg-landing-navy text-landing-lime group-hover:rotate-45 transition-transform">
                            <ArrowUpRight className="size-3.5" />
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    )
}
