"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { BrandLoader } from '@/components/ui/BrandLoader'

const CONFIRM_POLL_INTERVAL_MS = 3000
const CONFIRM_POLL_TIMEOUT_MS = 30000

export default function PaymentGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { user, loading: userLoading, refetch } = useUser()
    const [checking, setChecking] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [confirmTimedOut, setConfirmTimedOut] = useState(false)
    const isFirstRun = useRef(true)
    const justPaid = searchParams.get('checkout') === 'success'

    useEffect(() => {
        const evaluate = async () => {
            setChecking(true)
            // Reuse the already-fetched user on first run; revalidate on later navigations
            const current = isFirstRun.current ? user : await refetch()
            isFirstRun.current = false
            await authorize(current)
            setChecking(false)
        }

        if (!userLoading) evaluate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, userLoading])

    const pollForConfirmation = async () => {
        setConfirming(true)
        setConfirmTimedOut(false)
        const startedAt = Date.now()

        while (Date.now() - startedAt < CONFIRM_POLL_TIMEOUT_MS) {
            await new Promise(resolve => setTimeout(resolve, CONFIRM_POLL_INTERVAL_MS))
            const fresh = await refetch()
            if (fresh?.subscriptionStatus === 'active') {
                setConfirming(false)
                setAuthorized(true)
                return
            }
        }

        setConfirming(false)
        setConfirmTimedOut(true)
    }

    const authorize = async (user: any) => {
        if (!user) return // ProtectedRoute handles missing/invalid auth

        if (user.role === 'ADMIN') {
            setAuthorized(true)
            return
        }

        // ALLOW ACCESS to the checkout page even without an active subscription
        if (pathname === '/checkout/redirect') {
            setAuthorized(true)
            return
        }

        // Statuses: 'active', 'expired', 'pending_payment', 'canceled'
        if (user.subscriptionStatus === 'active') {
            setAuthorized(true)
            return
        }

        // The user just came back from paying via PIX — the webhook confirming it can
        // land a few seconds after the redirect does, so give it a grace window instead
        // of immediately bouncing someone who already paid back to the checkout page.
        if (justPaid) {
            setAuthorized(false)
            await pollForConfirmation()
            return
        }

        console.log('Subscription not active:', user.subscriptionStatus)
        setAuthorized(false)
        if (user.planId) {
            router.push(`/checkout/redirect?planId=${user.planId}`)
        } else {
            router.push('/#pricing')
        }
    }

    if (userLoading || checking) {
        return <BrandLoader size="md" fullScreen />
    }

    if (confirming) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
                <BrandLoader size="md" />
                <div>
                    <p className="font-bold text-foreground">Confirmando seu pagamento…</p>
                    <p className="text-sm text-muted-foreground mt-1">Isso costuma levar só alguns segundos.</p>
                </div>
            </div>
        )
    }

    if (confirmTimedOut) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
                <div>
                    <p className="font-bold text-foreground">Ainda processando seu pagamento</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        O PIX pode levar um pouco mais para confirmar. Atualize a página em instantes —
                        se o problema persistir, fale com o suporte.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm"
                >
                    Atualizar
                </button>
            </div>
        )
    }

    if (!authorized) {
        return null // Don't render dashboard content while redirecting
    }

    return <>{children}</>
}
