import type { Metadata } from "next"
import { LpHeader } from "@/components/landing/lp/LpHeader"
import { AdsLpHero } from "@/components/landing/lp/AdsLpHero"
import { AdsLpObjections } from "@/components/landing/lp/AdsLpObjections"
import { LpHowItWorks } from "@/components/landing/lp/LpHowItWorks"
import { LpProof } from "@/components/landing/lp/LpProof"
import { AdsLpFinalCta } from "@/components/landing/lp/AdsLpFinalCta"
import { LpStickyBar } from "@/components/landing/lp/LpStickyBar"
import { LpFooter } from "@/components/landing/lp/LpFooter"

export const metadata: Metadata = {
    title: "Direto ao ponto — ZapBroker",
    description:
        "Disparo em massa no WhatsApp feito pra corretor de imóveis. Ativa em 2 minutos, sem trocar de chip. Fala com a gente no WhatsApp.",
    robots: { index: false, follow: false },
    alternates: {
        canonical: "/lp",
    },
}

export default function AdsLandingPage() {
    return (
        <div className="relative min-h-screen bg-landing-mist text-landing-navy selection:bg-landing-lime/40 selection:text-landing-navy">
            <LpHeader />
            <main className="pb-20 md:pb-0">
                <AdsLpHero />
                <AdsLpObjections />
                <LpHowItWorks />
                <LpProof />
                <AdsLpFinalCta />
            </main>
            <LpFooter />
            <LpStickyBar />
        </div>
    )
}