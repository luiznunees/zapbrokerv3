import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import PainSection from '@/components/landing/PainSection'
import SocialProof from '@/components/landing/SocialProof'
import FAQ from '@/components/landing/FAQ'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import Pricing from '@/components/landing/Pricing'
import SupportButton from '@/components/SupportButton'
import AnimatedBackground from '@/components/landing/AnimatedBackground'
import Navbar from '@/components/landing/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent relative">
      <AnimatedBackground />

      <Navbar />

      <Hero />
      <PainSection />
      <Features />
      <Pricing />
      <SocialProof />
      <FAQ />

      {/* CTA Final */}
      <section className="py-24 bg-primary text-primary-foreground text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Pronto para dobrar seu VGV?</h2>
          <p className="text-primary-foreground/90 text-xl mb-10">
            Junte-se à elite do mercado imobiliário. Garanta sua condição de lançamento.
          </p>
          <Link href="/waitlist" className="px-10 py-4 bg-background text-foreground hover:bg-accent rounded-xl font-bold text-xl transition-all shadow-xl">
            Garanta sua Vaga
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span className="text-xl">⚡</span>
            <span className="font-bold text-lg text-foreground">ZapBroker</span>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Politica de Privacidade</Link>
          </div>

          <p className="text-sm text-muted-foreground">© 2024 ZapBroker. Corretores de Elite.</p>
        </div>
      </footer>

      <SupportButton />
    </main>
  )
}
