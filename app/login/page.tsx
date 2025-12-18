"use client"
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import AnimatedBackground from '@/components/landing/AnimatedBackground'
import ScrollAnimation from '@/components/ui/ScrollAnimation'
import { cn } from '@/lib/utils'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Simulate login
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

            <ScrollAnimation animation="scale-up">
                <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl p-8 shadow-2xl relative z-10">
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4">⚡</div>
                        <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
                        <p className="text-muted-foreground mt-2">Acesse sua máquina de vendas</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5 ml-1">
                                <label className="block text-sm font-medium text-muted-foreground">Senha</label>
                                <Link href="#" className="text-xs text-primary hover:underline">Esqueceu?</Link>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
                        </button>
                    </form>

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background/50 px-2 text-muted-foreground rounded-full backdrop-blur-sm">Ou continue com</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-background/50 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            <span className="text-sm font-medium">Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-background/50 transition-colors">
                            <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.63-.99 4.15-.82 1.66.17 2.48.83 3.32 2.17-2.77 1.37-2.3 5.48.56 6.81-.61 1.76-1.54 3.48-3.11 4.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                            <span className="text-sm font-medium">Apple</span>
                        </button>
                    </div>

                    <p className="text-center mt-8 text-muted-foreground text-sm">
                        Não tem conta? <Link href="/signup" className="text-primary hover:underline font-medium">Criar grátis</Link>
                    </p>
                </div>
            </ScrollAnimation>
        </div>
    )
}
