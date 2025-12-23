"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/services/api'
import { Loader2 } from 'lucide-react'

export default function PaymentGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        checkSubscription()
    }, [pathname])

    const checkSubscription = async () => {
        try {
            // Check current profile
            const { user } = await api.auth.profile()

            // Allow admin or special roles if needed
            if (user.role === 'ADMIN') {
                setAuthorized(true)
                setLoading(false)
                return
            }

            // Check subscription status from backend
            // Statuses: 'active', 'expired', 'none', 'pending_payment'

            if (user.subscriptionStatus === 'active') {
                setAuthorized(true)
            } else {
                // If not active, redirect to payment onboarding
                // But allow access if we are ALREADY on the payment page (to prevent loops, though this Guard wraps dashboard)
                // Since this guard is inside dashboard layout, redirecting to /onboarding/payment takes them out of this layout
                // So we just push to /onboarding/payment
                console.log('Subscription not active:', user.subscriptionStatus)
                router.push(`/onboarding/payment?status=${user.subscriptionStatus}`)
                return;
            }
        } catch (error) {
            console.error('PaymentGuard check failed', error)
            // If API fails (e.g. 401), ProtectedRoute usually handles it. 
            // If it's a network error, maybe let them pass? No, safer to block or retry.
            // For now, assume ProtectedRoute catches auth issues.
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!authorized) {
        return null // Don't render dashboard content while redirecting
    }

    return <>{children}</>
}
