"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLoader } from '@/components/ui/BrandLoader'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check for token on mount
        const token = localStorage.getItem('token')
        if (!token) {
            router.replace('/login')
        } else {
            setIsAuthenticated(true)
        }
        setIsLoading(false)
    }, [router])

    if (isLoading) {
        return <BrandLoader size="lg" fullScreen />
    }

    if (!isAuthenticated) {
        return null // Don't render anything while redirecting
    }

    return <>{children}</>
}
