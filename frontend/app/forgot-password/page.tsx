"use client"
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, KeyRound, Loader2, MailCheck } from 'lucide-react'
import { AuthInput, AuthError, AuthButton, AUTH_PAGE_BG, AUTH_GRADIENT } from '@/components/auth/AuthFormControls'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
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
        <div className={`min-h-screen w-full flex items-center justify-center ${AUTH_PAGE_BG} px-4`}>
            <div className="w-full max-w-sm">
                <div className="relative bg-white rounded-3xl shadow-xl px-8 py-10 text-center">
                    {/* Small gradient badge instead of a full banner — a lighter-weight
                        screen doesn't need the same visual weight as login/signup. */}
                    <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${AUTH_GRADIENT}`}>
                        <KeyRound className="w-6 h-6 text-white" />
                    </div>

                    <h1 className="text-2xl font-bold text-foreground tracking-tight mt-6">Esqueceu sua senha?</h1>
                    <p className="text-muted-foreground mt-2 text-sm">Digite seu email e mandamos um link pra você criar uma nova senha.</p>

                    <div className="mt-8 text-left">
                        {sent ? (
                            <div className="text-center space-y-3 bg-emerald-500/10 text-emerald-600 rounded-xl p-6">
                                <MailCheck className="w-8 h-8 mx-auto" />
                                <p className="font-medium">Email enviado!</p>
                                <p className="text-sm text-muted-foreground">Confira sua caixa de entrada (e o spam) e clique no link pra redefinir sua senha. Pode levar alguns minutos pra chegar.</p>
                                <div className="pt-2 flex items-center justify-center gap-4 text-xs">
                                    <button onClick={() => handleSubmit()} className="text-emerald-700 font-semibold hover:underline">
                                        Reenviar email
                                    </button>
                                    <a
                                        href="https://wa.me/5551980985330?text=Olá,%20não%20recebi%20o%20email%20de%20recuperação%20de%20senha"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-700 font-semibold hover:underline"
                                    >
                                        Não chegou? Fale conosco
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <AuthInput id="email" type="email" label="Email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

                                {errorMsg && <AuthError>{errorMsg}</AuthError>}

                                <AuthButton type="submit" loading={loading}>
                                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                    Enviar link de recuperação
                                </AuthButton>
                            </form>
                        )}
                    </div>
                </div>

                <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Voltar pro login
                </Link>
            </div>
        </div>
    )
}
