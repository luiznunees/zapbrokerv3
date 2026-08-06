"use client"
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthInput, AuthError, AuthButton } from '@/components/auth/AuthFormControls'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const planId = urlParams.get('planId');
        if (planId) {
            localStorage.setItem('pendingPlanId', planId);
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        // A token in localStorage doesn't mean it's still valid — it could be expired or
        // revoked. Confirming with the backend first avoids silently bouncing the user to
        // /dashboard only for it to bounce them right back here a moment later (a confusing
        // flicker/loop), and skips the auto-redirect entirely for a genuinely dead session.
        import('@/services/api').then(({ api }) =>
            api.auth.me()
                .then(() => {
                    if (planId) {
                        localStorage.removeItem('pendingPlanId');
                        window.location.href = `/checkout/redirect?planId=${planId}`;
                    } else {
                        window.location.href = '/dashboard';
                    }
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                })
        );
    }, []);

    const handleSubmit = async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const email = (document.getElementById('email') as HTMLInputElement)?.value;
            const password = (document.getElementById('password') as HTMLInputElement)?.value;

            if (!email || !password) {
                setErrorMsg('Preencha email e senha.');
                setLoading(false)
                return
            }

            const { token, user, session } = await import('@/services/api').then(m => m.api.auth.login({ email, password }));

            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Entrega a sessão pro client do Supabase — a partir daqui ele renova o
                // token sozinho em segundo plano (autoRefreshToken), então o login não
                // expira mais em ~1h. Sem isso, só o access_token cru ficava salvo.
                if (session?.access_token && session?.refresh_token) {
                    const { supabase } = await import('@/lib/supabase');
                    await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
                }

                const pendingPlanId = localStorage.getItem('pendingPlanId');
                if (pendingPlanId) {
                    localStorage.removeItem('pendingPlanId');
                    window.location.href = `/checkout/redirect?planId=${pendingPlanId}`;
                } else {
                    window.location.href = '/dashboard';
                }
            } else {
                setErrorMsg('Token não recebido. Tente novamente.');
            }
        } catch (error: any) {
            setErrorMsg(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthShell
            bannerEyebrow="Você pode facilmente"
            bannerTitle="Automatizar seu WhatsApp e vender no piloto automático"
            title="Entrar na conta"
            subtitle="Acesse suas campanhas e leads, de onde estiver."
        >
            <div className="space-y-4">
                <AuthInput id="email" name="email" type="email" required label="Seu email" placeholder="seu@email.com" />

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                        Senha
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            className="w-full px-4 py-3.5 pr-11 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {errorMsg && <AuthError>{errorMsg}</AuthError>}

                <AuthButton type="button" onClick={handleSubmit} loading={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Entrando...
                        </>
                    ) : (
                        'Entrar'
                    )}
                </AuthButton>

                <div className="text-center">
                    <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Esqueci minha senha
                    </Link>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Não tem conta?{' '}
                    <Link href="/signup" className="text-primary font-semibold hover:underline">
                        Cadastre-se
                    </Link>
                </p>
            </div>
        </AuthShell>
    )
}
