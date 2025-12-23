"use client"
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import AnimatedBackground from '@/components/landing/AnimatedBackground'
import ScrollAnimation from '@/components/ui/ScrollAnimation'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Get email and password directly from form implementation below
            const form = e.target as HTMLFormElement;
            const email = (form.elements.namedItem('email') as HTMLInputElement).value;
            const password = (form.elements.namedItem('password') as HTMLInputElement).value;

            const { token, user } = await import('@/services/api').then(m => m.api.auth.login({ email, password }));

            if (token) {
                console.log('✅ Login successful, saving token:', token.substring(0, 20) + '...');
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                window.location.href = '/dashboard';
            } else {
                console.error('❌ No token received from login');
            }
        } catch (error: any) {
            console.error('Login failed:', error);
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
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Bem-vindo de volta</h1>
                        <p className="text-muted-foreground mt-1.5 text-sm">Acesse sua máquina de vendas.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-accent/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-foreground">Senha</label>
                                <Link href="#" className="text-[10px] text-primary hover:underline font-medium">Esqueceu a senha?</Link>
                            </div>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-accent/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-sm transition-all shadow-md shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar na Conta"}
                        </button>
                    </form>

                    <div className="mt-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-background px-3 text-muted-foreground font-medium selection:bg-none">Ou continue com</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                            onClick={() => api.auth.google()}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            <span className="text-xs font-semibold">Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                            <svg className="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.63-.99 4.15-.82 1.66.17 2.48.83 3.32 2.17-2.77 1.37-2.3 5.48.56 6.81-.61 1.76-1.54 3.48-3.11 4.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                            <span className="text-xs font-semibold">Apple</span>
                        </button>
                    </div>

                    <p className="text-center mt-8 text-muted-foreground text-xs">
                        Não tem conta? <Link href="/signup" className="text-primary hover:underline font-bold transition-all">Criar grátis</Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Banner */}
            <div className="hidden lg:flex relative bg-primary/5 items-center justify-center overflow-hidden">
                <AnimatedBackground />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20 mix-blend-overlay" />

                <div className="relative z-10 p-8 max-w-sm text-center backdrop-blur-sm rounded-2xl bg-background/10 border border-white/5 shadow-xl">
                    <div className="mb-6 flex justify-center">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                            <span className="text-3xl">🚀</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-4">
                        Potencialize suas Vendas
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Automatize seu atendimento, gerencie leads e escale seus resultados com a plataforma de automação mais completa do mercado.
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                        <div className="flex -space-x-1.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-6 h-6 rounded-full border-2 border-background bg-zinc-800 flex items-center justify-center text-[8px]`}>User</div>
                            ))}
                        </div>
                        <span>+1.000 empresas confiam</span>
                    </div>
                </div>
            </div>

        </div>
    )
}
