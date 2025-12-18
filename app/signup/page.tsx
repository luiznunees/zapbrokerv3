"use client"
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import AnimatedBackground from '@/components/landing/AnimatedBackground'
import ScrollAnimation from '@/components/ui/ScrollAnimation'

export default function SignupPage() {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Simulate signup
        await new Promise(resolve => setTimeout(resolve, 2000))
        setLoading(false)
        window.location.href = '/dashboard'
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
            <AnimatedBackground />

            <div className="absolute top-6 left-6 z-10">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-background/20 backdrop-blur-sm">
                    <ArrowLeft className="w-5 h-5" /> Voltar
                </Link>
            </div>

            <ScrollAnimation animation="scale-up" delay={200}>
                <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-8 shadow-2xl relative z-10">
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4">🚀</div>
                        <h1 className="text-2xl font-bold text-foreground">Crie sua Conta</h1>
                        <p className="text-muted-foreground mt-2">Teste grátis por 7 dias. Sem cartão.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Nome Completo</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Email Profissional</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">WhatsApp</label>
                            <input
                                type="tel"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Senha</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-start gap-2 pt-2 pb-2">
                            <input type="checkbox" required id="terms" className="mt-1 rounded border-border bg-background/50 text-primary focus:ring-primary/20" />
                            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                                Li e concordo com os <Link href="/legal/terms" className="text-primary hover:underline">Termos de Uso</Link> e <Link href="/legal/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Começar Agora"}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-muted-foreground text-sm">
                        Já tem conta? <Link href="/login" className="text-primary hover:underline font-medium">Entrar</Link>
                    </p>
                </div>
            </ScrollAnimation>
        </div>
    )
}
