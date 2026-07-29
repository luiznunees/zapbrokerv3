"use client"
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')
        try {
            const { supabase } = await import('@/lib/supabase')
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            if (error) throw error
            setSent(true)
        } catch (error: any) {
            setErrorMsg(error.message || 'Erro ao enviar o email. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background px-6">
            <div className="absolute top-6 left-6">
                <Link href="/login" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium text-xs">
                    <ArrowLeft className="w-4 h-4" /> Voltar pro login
                </Link>
            </div>

            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-6">
                        <BrandLogo className="h-10 w-auto text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Esqueceu sua senha?</h1>
                    <p className="text-muted-foreground mt-3 text-sm">Digite seu email e mandamos um link pra você criar uma nova senha.</p>
                </div>

                {sent ? (
                    <div className="text-center space-y-3 bg-emerald-500/10 text-emerald-600 rounded-xl p-6">
                        <MailCheck className="w-8 h-8 mx-auto" />
                        <p className="font-medium">Email enviado!</p>
                        <p className="text-sm text-muted-foreground">Confira sua caixa de entrada (e o spam) e clique no link pra redefinir sua senha.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>

                        {errorMsg && (
                            <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 px-3 rounded-xl">
                                {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar link de recuperação'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
