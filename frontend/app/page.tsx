import { Header } from "@/components/landing/Header"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { AgentShowcase } from "@/components/landing/AgentShowcase"
import { Pricing } from "@/components/landing/Pricing"
import { FAQ } from "@/components/landing/FAQ"
import { AppPromo } from "@/components/landing/AppPromo"
import { Footer, CTA } from "@/components/landing/Footer"

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
