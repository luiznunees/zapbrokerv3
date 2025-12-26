import { Header } from "@/components/landing/Header"
import { Hero } from "@/components/landing/Hero"
import { Stats } from "@/components/landing/Stats"
import { Features } from "@/components/landing/Features"
import { MockupSection } from "@/components/landing/MockupSection"
import { Pricing } from "@/components/landing/Pricing"
import { Testimonials } from "@/components/landing/Testimonials"
import { FAQ } from "@/components/landing/FAQ"
import { Footer, CTA } from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-brand-purple-500/30 selection:text-brand-purple-900">
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Stats />
          <Features />
          <MockupSection />
          <Pricing />
          <Testimonials />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  )
}
