"use client"

import { useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react'
import { api } from '@/services/api'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Uncomment when backend has this endpoint
            // await api.auth.forgotPassword(email);
            
            // Mock success for now
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar email. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-2">
                    <Link href="/">
                        <BrandLogo className="h-10 w-auto text-brand-purple-600 mb-4" />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Recuperar Senha</h1>
                    <p className="text-sm text-muted-foreground">
                        Digite seu email para receber um link de redefinição.
                    </p>
                </div>

                {success ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center animate-in fade-in zoom-in-95">
                        <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Email Enviado!</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Verifique sua caixa de entrada (e spam) para redefinir sua senha.
                        </p>
                        <Link 
                            href="/login"
                            className="text-sm font-medium text-brand-purple-600 hover:text-brand-purple-500 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Voltar para Login
                        </Link>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1">Email Cadastrado</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-brand-purple-500/20 transition-all font-medium text-sm"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-xs text-red-500 font-medium bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full py-2.5 bg-brand-purple-600 hover:bg-brand-purple-700 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Enviar Link de Recuperação
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link 
                                href="/login" 
                                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                            >
                                <ArrowLeft className="w-3 h-3" /> Voltar para Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
