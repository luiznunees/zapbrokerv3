"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLoader } from '@/components/ui/BrandLoader'
import { api } from '@/services/api'

// Guard próprio do painel admin — diferente de ProtectedRoute (usado pelo dashboard de
// usuário comum), que só checa se existe token e sempre manda pra /login. Aqui a gente
// também confere se a conta é admin de verdade (mesma checagem que AdminLoginForm.tsx já
// faz no login) e manda pro destino certo em cada caso, em vez de cair sempre no login de
// usuário comum (achado real: no celular, sem token salvo, isso jogava o fundador direto
// no dashboard de corretor pedindo login).
export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        async function check() {
            const token = localStorage.getItem('token')
            if (!token) {
                router.replace('/zbteam')
                return
            }

            try {
                const freshUser = await api.auth.me()
                if (cancelled) return

                if (freshUser?.user?.role !== 'admin') {
                    router.replace('/dashboard')
                    return
                }

                setIsAdmin(true)
            } catch {
                if (cancelled) return
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                router.replace('/zbteam')
                return
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        check()
        return () => { cancelled = true }
    }, [router])

    if (isLoading) {
        return <BrandLoader size="lg" fullScreen />
    }

    if (!isAdmin) {
        return null // Não renderiza nada enquanto redireciona
    }

    return <>{children}</>
}
