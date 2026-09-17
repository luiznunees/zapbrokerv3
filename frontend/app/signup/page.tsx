"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/services/api'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { PLAN_INFO } from '@/lib/plans'
import { BrandLogo } from '@/components/BrandLogo'
import { AuthInput, AuthError, AuthButton, AUTH_PAGE_BG, AUTH_GRADIENT, GradientBlobs } from '@/components/auth/AuthFormControls'

export default function SignupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const inviteCode = searchParams.get('invite')
    const planId = searchParams.get('planId')
    const plan = planId ? PLAN_INFO[planId] : undefined

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [inviteValid, setInviteValid] = useState<boolean | null>(null)
    const [inviteTrialDays, setInviteTrialDays] = useState<number | null>(null)
    const [inviteEmailLocked, setInviteEmailLocked] = useState(false)
    const [checkingInvite, setCheckingInvite] = useState(false)

    useEffect(() => {
        if (!inviteCode) return
        setCheckingInvite(true)
        api.auth.checkInvite(inviteCode)
            .then((data: any) => {
                setInviteValid(!!data.valid)
                setInviteTrialDays(data.trialDays || null)
                if (data.email) {
                    setEmail(data.email)
                    setInviteEmailLocked(true)
                }
            })
            .catch(() => setInviteValid(false))
            .finally(() => setCheckingInvite(false))
    }, [inviteCode])

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password !== confirmPassword) {
            setError('As senhas não coincidem')
            setLoading(false)
            return
        }

        if (inviteCode && inviteValid === false) {
            setError('Esse link de convite não é mais válido. Fale com quem te convidou pra pedir um novo.')
            setLoading(false)
            return
        }

        try {
            const result = await api.auth.register({
                name,
                email,
                password,
                inviteCode,
                planId: planId && !inviteCode ? planId : undefined,
            })

            if (result.token) {
                localStorage.setItem('token', result.token)
                localStorage.setItem('user', JSON.stringify(result.user))

                // Mesma lógica do login — entrega a sessão pro client do Supabase pra ele
                // renovar sozinho depois, em vez do access_token cru expirar em ~1h.
                if (result.session?.access_token && result.session?.refresh_token) {
                    const { supabase } = await import('@/lib/supabase')
                    await supabase.auth.setSession({ access_token: result.session.access_token, refresh_token: result.session.refresh_token })
                }
            }

            if (planId && !inviteCode && result.token) {
                router.push(`/checkout/redirect?planId=${planId}`)
            } else if (result.token) {
                router.push('/dashboard')
            } else {
                router.push('/login?registered=true')
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao criar conta. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`min-h-screen w-full ${AUTH_PAGE_BG} px-4 py-8 sm:py-12`}>
            <div className="max-w-md mx-auto">
                {/* Top gradient banner — signup's own composition, same brand gradient as login's panel */}
                <div className={`relative rounded-3xl px-8 pt-8 pb-16 overflow-hidden ${AUTH_GRADIENT}`}>
                    <GradientBlobs />
                    <div className="relative z-10 flex items-center justify-between">
                        <BrandLogo className="h-8 w-auto text-white" monochrome />
                        <Link href="/login" className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-xs font-medium">
                            <ArrowLeft className="w-3.5 h-3.5" /> Entrar
                        </Link>
                    </div>
                    <h1 className="relative z-10 text-2xl font-bold text-white leading-tight mt-8">
                        Sua imobiliária vendendo no automático em minutos
                    </h1>
                </div>

                {/* Form card overlapping the banner */}
                <div className="relative -mt-8 bg-white rounded-3xl shadow-xl px-6 py-8 sm:px-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Crie sua conta</h2>
                        <p className="text-muted-foreground mt-2 text-sm">Comece a automação da sua imobiliária hoje.</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        {plan && !inviteCode && (
                            <div className="flex items-center justify-between rounded-xl border border-border bg-primary/5 px-4 py-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Você está assinando</p>
                                    <p className="font-bold">Plano {plan.name}</p>
                                </div>
                                <p className="font-bold text-lg">
                                    R$ {plan.price}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                                </p>
                            </div>
                        )}

                        {inviteCode && checkingInvite && (
                            <div className="flex items-center gap-2 rounded-xl bg-accent/50 border border-border px-4 py-3 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verificando convite...
                            </div>
                        )}

                        {inviteCode && !checkingInvite && inviteValid && (
                            <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-3 text-sm">
                                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold">Convite aplicado!</p>
                                    <p>
                                        {inviteTrialDays
                                            ? `Você ganhou ${inviteTrialDays} dias de teste grátis.`
                                            : 'Você está se registrando com um código de convite especial.'}
                                        {inviteEmailLocked && ' Esse convite é exclusivo pro email abaixo.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {inviteCode && !checkingInvite && inviteValid === false && (
                            <AuthError>Esse link de convite não é mais válido (expirado ou já usado). Fale com quem te convidou pra pedir um novo.</AuthError>
                        )}

                        <AuthInput id="name" label="Nome completo" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
                        <AuthInput id="email" type="email" label="Email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={inviteEmailLocked} />
                        <AuthInput id="password" type="password" label="Senha" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <AuthInput id="confirmPassword" type="password" label="Confirmar senha" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

                        {error && <AuthError>{error}</AuthError>}

                        <AuthButton type="submit" loading={loading} disabled={checkingInvite || (!!inviteCode && inviteValid === false)}>
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                            Criar conta
                        </AuthButton>

                        <p className="text-center text-sm text-muted-foreground">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-primary font-semibold hover:underline">
                                Entrar
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
