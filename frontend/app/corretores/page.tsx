import type { Metadata } from "next"
import { LpHeader } from "@/components/landing/lp/LpHeader"
import { LpHero } from "@/components/landing/lp/LpHero"
import { LpPain } from "@/components/landing/lp/LpPain"
import { LpHowItWorks } from "@/components/landing/lp/LpHowItWorks"
import { LpProof } from "@/components/landing/lp/LpProof"
import { LpPricing } from "@/components/landing/lp/LpPricing"
import { LpFAQ } from "@/components/landing/lp/LpFAQ"
import { LpFinalCTA } from "@/components/landing/lp/LpFinalCTA"
import { LpStickyBar } from "@/components/landing/lp/LpStickyBar"
import { LpFooter } from "@/components/landing/lp/LpFooter"

export const metadata: Metadata = {
    title: "Pare de perder lead por demorar pra responder",
    description: "O ZapBroker dispara mensagem pra toda sua lista de leads de uma vez — direto no seu WhatsApp. Ative em 2 minutos.",
    robots: { index: false, follow: false },
    alternates: {
        canonical: "/corretores",
    },
}

export default function CorretoresLandingPage() {
    return (
        <div className="relative min-h-screen bg-landing-mist text-landing-navy selection:bg-landing-lime/40 selection:text-landing-navy">
            <LpHeader />
            <main className="pb-20 md:pb-0">
                <LpHero />
                <LpPain />
                <LpHowItWorks />
                <LpProof />
                <LpPricing />
                <LpFAQ />
                <LpFinalCTA />
            </main>
            <LpFooter />
            <LpStickyBar />
        </div>
    )
}
