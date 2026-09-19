"use client"

import { useState } from 'react'
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { api } from '@/services/api'

export function AdminLoginForm() {
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')
        try {
            const email = (document.getElementById('email') as HTMLInputElement)?.value
            const password = (document.getElementById('password') as HTMLInputElement)?.value

            if (!email || !password) {
                setErrorMsg('Preencha email e senha.')
                return
            }

            const { token, session } = await api.auth.login({ email, password })
            if (!token) {
                setErrorMsg('Token não recebido. Tente novamente.')
                return
            }

            localStorage.setItem('token', token)

            if (session?.access_token && session?.refresh_token) {
                const { supabase } = await import('@/lib/supabase')
                await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
            }

            // O /auth/login devolve o usuário cru do Supabase Auth, sem o campo "role" (isso
            // só existe na tabela public.users) — por isso confere a role real via /auth/me
            // antes de deixar entrar, em vez de confiar no retorno do login.
            const freshUser = await api.auth.me()
            if (freshUser?.user?.role !== 'admin') {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                setErrorMsg('Essa conta não tem acesso administrativo.')
                return
            }

            localStorage.setItem('user', JSON.stringify(freshUser.user))
            window.location.href = '/admin'
        } catch (error: any) {
            setErrorMsg(error.message || 'Erro ao entrar. Verifique suas credenciais.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10">
                    <ShieldCheck className="size-5 text-primary" />
                </div>
                <div>
                    <h1 className="font-display text-xl font-extrabold text-zinc-100">Acesso administrativo</h1>
                    <p className="text-zinc-500 text-sm mt-1">Restrito à equipe do ZapBroker.</p>
                </div>
            </div>

            <div className="space-y-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <div>
                    <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoFocus
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:border-primary outline-none transition-all"
                        placeholder="voce@zapbroker.dev"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:border-primary outline-none transition-all"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-3 rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-full bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </div>
        </form>
    )
}
