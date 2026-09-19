import type { Metadata } from "next"
import { Header } from "@/components/landing/Header"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { AgentShowcase } from "@/components/landing/AgentShowcase"
import { Pricing } from "@/components/landing/Pricing"
import { FAQ } from "@/components/landing/FAQ"
import { FAQ_ITEMS } from "@/components/landing/faqData"
import { AppPromo } from "@/components/landing/AppPromo"
import { Footer, CTA } from "@/components/landing/Footer"

const SITE_URL = "https://zapbroker.dev"

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ZapBroker",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Disparo em massa de WhatsApp feito pra corretor de imóveis não perder lead por falta de contato. Conecta o WhatsApp normal do corretor, sem trocar de número.",
  offers: [
    { "@type": "Offer", name: "Starter", price: "39.00", priceCurrency: "BRL", priceValidUntil: "2027-12-31" },
    { "@type": "Offer", name: "Pro", price: "79.00", priceCurrency: "BRL", priceValidUntil: "2027-12-31" },
  ],
  url: SITE_URL,
}

// Montado em cima do FAQ_ITEMS que a seção FAQ da própria home usa — mesma fonte de
// verdade, sem duplicar as perguntas/respostas com o risco de ficarem desalinhadas.
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
}

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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  )
}
