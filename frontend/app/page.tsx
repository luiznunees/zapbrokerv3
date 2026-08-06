import { Header } from "@/components/landing/Header"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { AgentShowcase } from "@/components/landing/AgentShowcase"
import { Testimonials } from "@/components/landing/Testimonials"
import { Pricing } from "@/components/landing/Pricing"
import { FAQ } from "@/components/landing/FAQ"
import { Footer, CTA } from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-brand-purple-500/30 selection:text-brand-purple-900">
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Features />
          <AgentShowcase />
          <Testimonials />
          <Pricing />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  )
}
