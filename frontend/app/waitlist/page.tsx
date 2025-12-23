"use client"
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function WaitlistPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setLoading(false)
        setSuccess(true)
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="p-6">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <span className="text-4xl block mb-2">⚡</span>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Lista de Espera VIP
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Estamos liberando acesso gradualmente. Entre na lista para garantir <b>1 Mês de Plano Pro Grátis</b> no lançamento.
                        </p>
                    </div>

                    {success ? (
                        <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-2xl text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">Você está na lista!</h2>
                            <p className="text-muted-foreground mb-6">
                                Fique de olho no seu WhatsApp. Avisaremos assim que sua vaga for liberada.
                            </p>
                            <Link href="/" className="text-primary hover:underline font-medium">
                                Voltar para a Home
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">Nome Completo</label>
                                <input type="text" id="name" required className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="Seu nome" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">Email Profissional</label>
                                <input type="email" id="email" required className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="seu@email.com" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">WhatsApp</label>
                                <input type="tel" id="phone" required className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all" placeholder="(00) 00000-0000" />
                            </div>
                            <button disabled={loading} type="submit" className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Garantir minha Vaga"}
                            </button>
                            <p className="text-xs text-center text-muted-foreground">
                                Seus dados estão seguros. Zero spam.
                            </p>
                        </form>
                    )}
                </div>
            </main>
        </div>
    )
}
