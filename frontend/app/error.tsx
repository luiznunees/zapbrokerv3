"use client"

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/20">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Algo deu errado!</h1>
                    <p className="text-muted-foreground text-sm">
                        Encontramos um erro inesperado ao carregar esta página. Nossa equipe já foi notificada.
                    </p>
                    {error.message && (
                        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 mt-4 text-xs font-mono text-red-500/80 break-all">
                            {error.message}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={reset}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Tentar Novamente
                        </button>
                        <a
                            href="/dashboard"
                            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-colors rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        >
                            Ir para Dashboard
                        </a>
                    </div>

                    <a
                        href="https://wa.me/5551989194794"
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors rounded-lg border border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
                        Falar com Suporte
                    </a>
                </div>
            </div>
        </div>
    )
}
