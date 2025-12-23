"use client"
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import AnimatedBackground from '@/components/landing/AnimatedBackground'
import ScrollAnimation from '@/components/ui/ScrollAnimation'

export default function SignupPage() {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const form = e.target as HTMLFormElement;
            const name = (form.elements.namedItem('name') as HTMLInputElement).value;
            const email = (form.elements.namedItem('email') as HTMLInputElement).value;
            const whatsapp = (form.elements.namedItem('whatsapp') as HTMLInputElement).value;
            const password = (form.elements.namedItem('password') as HTMLInputElement).value;

            // Note: whatsapp field is not yet handled by backend register, but we send it anyway or store later
            // For now standard register
            const { token, user } = await import('@/services/api').then(m => m.api.auth.register({ name, email, password }));

            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                window.location.href = '/dashboard';
            } else {
                // Email confirmation might be required
                // Account created - redirect to login
                window.location.href = '/login';
            }
        } catch (error: any) {
            console.error('Signup failed:', error);
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-background">

            {/* Left Side - Form */}
            <div className="relative flex flex-col justify-center px-6 sm:px-8 lg:px-12">
                <div className="absolute top-6 left-6">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium text-xs">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </Link>
                </div>

                <div className="w-full max-w-sm mx-auto">
                    <div className="mb-6 text-center">
                        <div className="flex justify-center mb-4">
                            <BrandLogo className="h-8 w-auto text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Crie sua Conta</h1>
                        <p className="text-muted-foreground mt-1.5 text-sm">Teste grátis por 7 dias. Sem cartão.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Nome Completo</label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-accent/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Email Profissional</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-accent/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">WhatsApp</label>
                            <input
                                type="tel"
                                name="whatsapp"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-accent/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Senha</label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-accent/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-start gap-2 pt-1">
                            <input type="checkbox" required id="terms" className="mt-1 rounded border-border bg-background/50 text-primary focus:ring-primary/20" />
                            <label htmlFor="terms" className="text-[10px] text-muted-foreground leading-relaxed">
                                Li e concordo com os <Link href="/legal/terms" className="text-primary hover:underline">Termos de Uso</Link> e <Link href="/legal/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-sm transition-all shadow-md shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Começar Agora"}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-muted-foreground text-xs">
                        Já tem conta? <Link href="/login" className="text-primary hover:underline font-bold transition-all">Entrar</Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Banner */}
            <div className="hidden lg:flex relative bg-primary/5 items-center justify-center overflow-hidden">
                <AnimatedBackground />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-purple-500/20 mix-blend-overlay" />

                <div className="relative z-10 p-8 max-w-sm text-center backdrop-blur-sm rounded-2xl bg-background/10 border border-white/5 shadow-xl">
                    <div className="mb-6 flex justify-center">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-bl from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <span className="text-3xl">📈</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-500 mb-4">
                        Escale seu Negócio
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Junte-se a milhares de empresas que usam o ZapBroker para multiplicar suas vendas e organizar o atendimento.
                    </p>
                </div>
            </div>

        </div>
    )
}
