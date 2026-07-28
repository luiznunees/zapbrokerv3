import { BarChart3, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function EmptyStateKanban() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="w-10 h-10 text-purple-500" />
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-2">
                Nenhum lead nesta campanha
            </h3>

            <p className="text-muted-foreground mb-8 max-w-md">
                Envie sua primeira campanha para ver os leads aparecerem aqui no Kanban
            </p>

            <Link
                href="/dashboard/campaigns"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-all"
            >
                Ver Campanhas
                <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
                <div className="bg-gray-50 rounded-lg p-3 border-2 border-border">
                    <p className="text-xs font-bold mb-1">📋 Na Fila</p>
                    <p className="text-xs text-muted-foreground">Aguardando envio</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                    <p className="text-xs font-bold mb-1">📤 Enviado</p>
                    <p className="text-xs text-muted-foreground">Mensagem enviada</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border-2 border-green-200">
                    <p className="text-xs font-bold mb-1">💬 Respondeu</p>
                    <p className="text-xs text-muted-foreground">Lead interessado</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 border-2 border-emerald-200">
                    <p className="text-xs font-bold mb-1">✅ Convertido</p>
                    <p className="text-xs text-muted-foreground">Venda fechada!</p>
                </div>
            </div>
        </div>
    )
}
