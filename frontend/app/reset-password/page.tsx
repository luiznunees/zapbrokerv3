"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

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
        <div className="min-h-screen w-full flex items-center justify-center bg-background px-6">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-6">
                        <BrandLogo className="h-10 w-auto text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Criar nova senha</h1>
                </div>

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
                                <div className="text-red-500 text-sm bg-red-500/10 py-3 px-4 rounded-xl">{errorMsg}</div>
                                <Link href="/forgot-password" className="text-sm text-primary hover:underline">Pedir novo link</Link>
                            </>
                        ) : (
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">Nova senha</label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">Confirmar nova senha</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="••••••••"
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
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Redefinir senha'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
