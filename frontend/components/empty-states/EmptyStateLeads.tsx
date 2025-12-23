import { Users, Upload, Plus } from 'lucide-react'
import Link from 'next/link'

export function EmptyStateLeads() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-emerald-500" />
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-2">
                Nenhum contato ainda
            </h3>

            <p className="text-muted-foreground mb-8 max-w-md">
                Importe sua primeira lista de contatos para começar a enviar campanhas
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => {
                        // Trigger file upload
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = '.csv,.xlsx'
                        input.click()
                    }}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-all"
                >
                    <Upload className="w-5 h-5" />
                    Importar Contatos
                </button>

                <Link
                    href="/dashboard/leads"
                    className="inline-flex items-center gap-2 bg-accent text-foreground px-6 py-3 rounded-lg font-bold hover:bg-accent/80 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Manualmente
                </Link>
            </div>

            <div className="mt-8 bg-accent/50 rounded-lg p-4 max-w-md">
                <p className="text-sm font-medium mb-2">💡 Dica:</p>
                <p className="text-xs text-muted-foreground">
                    Você pode importar arquivos CSV ou Excel com as colunas: Nome, Telefone, Email
                </p>
            </div>
        </div>
    )
}
