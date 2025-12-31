"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function SignupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const inviteCode = searchParams.get('invite')

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Basic invite validation/feedback
    const [inviteValid, setInviteValid] = useState<boolean | null>(null)

    useEffect(() => {
        if (inviteCode) {
            // Ideally call an endpoint to validate code, but for now just show visual feedback
            setInviteValid(true)
        }
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

        try {
            // Pass invite code to register endpoint if available
            // Note: Update backend 'register' to accept 'inviteCode' if needed
            // For now, standard register. If invite code logic is complex (skips payment), backend needs update.
            // Assuming backend logic: if invite code, assign plan.

            await api.auth.register({
                name,
                email,
                password,
                inviteCode // Pass this along
            })

            // Redirect to login or dashboard
            router.push('/login?registered=true')
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao criar conta. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md border-border bg-card">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Crie sua conta</CardTitle>
                    <CardDescription className="text-center">
                        Comece a automação do seu imobiliária hoje
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {inviteCode && (
                        <Alert className="mb-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Convite Aplicado!</AlertTitle>
                            <AlertDescription>Você está se registrando com um código de convite especial.</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome completo</Label>
                            <Input
                                id="name"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Criar conta
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground text-center">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            Entrar
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
