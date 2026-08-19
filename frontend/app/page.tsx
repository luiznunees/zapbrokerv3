import type { Metadata } from "next"
import { Header } from "@/components/landing/Header"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { AgentShowcase } from "@/components/landing/AgentShowcase"
import { Pricing } from "@/components/landing/Pricing"
import { FAQ } from "@/components/landing/FAQ"
import { AppPromo } from "@/components/landing/AppPromo"
import { Footer, CTA } from "@/components/landing/Footer"

export const metadata: Metadata = {
  title: "Disparo em Massa no WhatsApp para Corretores de Imóveis — ZapBroker",
  description:
    "Cada mensagem que você atrasa vira uma venda perdida. O ZapBroker dispara pra toda sua lista de leads de uma vez, direto no seu WhatsApp. Ative em 2 minutos.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Disparo em Massa no WhatsApp para Corretores de Imóveis — ZapBroker",
    description:
      "Cada mensagem que você atrasa vira uma venda perdida. O ZapBroker dispara pra toda sua lista de leads de uma vez, direto no seu WhatsApp.",
  },
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-landing-mist text-landing-navy selection:bg-landing-lime/40 selection:text-landing-navy">
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Features />
          <AgentShowcase />
          <Pricing />
          <FAQ />
          <AppPromo />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  )
}
