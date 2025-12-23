import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-10 h-10 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">404</h1>
                    <h2 className="text-xl font-semibold">Página não encontrada</h2>
                    <p className="text-muted-foreground">
                        A página que você está procurando não existe ou foi movida.
                    </p>
                </div>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-colors rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Voltar para o Dashboard
                </Link>
            </div>
        </div>
    )
}
