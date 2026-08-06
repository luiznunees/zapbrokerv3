"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { AuthInput, AuthError, AuthButton, AUTH_PAGE_BG, AUTH_GRADIENT } from '@/components/auth/AuthFormControls'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [ready, setReady] = useState(false)

    // O link do email do Supabase entrega a sessão de recuperação via hash da URL
    // (#access_token=...&type=recovery) — o client do supabase já processa isso sozinho
    // ao carregar; só precisamos confirmar que a sessão existe antes de deixar trocar a senha.
    useEffect(() => {
        (async () => {
            const { supabase } = await import('@/lib/supabase')
            const { data } = await supabase.auth.getSession()
            setReady(!!data.session)
            if (!data.session) {
                setErrorMsg('Link inválido ou expirado. Peça um novo link de recuperação.')
            }
        })()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')

        if (password.length < 6) {
            setErrorMsg('A senha precisa ter pelo menos 6 caracteres.')
            return
        }
        if (password !== confirmPassword) {
            setErrorMsg('As senhas não coincidem.')
            return
        }

        setLoading(true)
        try {
            const { supabase } = await import('@/lib/supabase')
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setDone(true)
            setTimeout(() => router.push('/login'), 2000)
        } catch (error: any) {
            setErrorMsg(error.message || 'Erro ao redefinir a senha. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`min-h-screen w-full flex items-center justify-center ${AUTH_PAGE_BG} px-4`}>
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Thin gradient header bar — same identity as the login banner and the
                    forgot-password badge, dialed down to a strip since this is a one-off action. */}
                <div className={`h-2 ${AUTH_GRADIENT}`} />

                <div className="px-8 py-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${AUTH_GRADIENT}`}>
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Criar nova senha</h1>
                    </div>
                    <p className="text-muted-foreground text-sm mb-8">Escolha uma senha forte para proteger sua conta.</p>

                    {done ? (
                        <div className="text-center space-y-3 bg-emerald-500/10 text-emerald-600 rounded-xl p-6">
                            <CheckCircle2 className="w-8 h-8 mx-auto" />
                            <p className="font-medium">Senha redefinida com sucesso!</p>
                            <p className="text-sm text-muted-foreground">Te levando pro login...</p>
                        </div>
                    ) : !ready ? (
                        <div className="text-center space-y-3">
                            {errorMsg ? (
                                <>
                                    <AuthError>{errorMsg}</AuthError>
                                    <Link href="/forgot-password" className="text-sm text-primary font-semibold hover:underline">Pedir novo link</Link>
                                </>
                            ) : (
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthInput id="password" type="password" label="Nova senha" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            <AuthInput id="confirmPassword" type="password" label="Confirmar nova senha" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

                            {errorMsg && <AuthError>{errorMsg}</AuthError>}

                            <AuthButton type="submit" loading={loading}>
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                Redefinir senha
                            </AuthButton>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
