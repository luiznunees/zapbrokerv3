import { Send, Plus } from 'lucide-react'
import Link from 'next/link'

export function EmptyStateCampaigns() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Send className="w-10 h-10 text-primary" />
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-2">
                Nenhuma campanha ainda
            </h3>

            <p className="text-muted-foreground mb-8 max-w-md">
                Crie sua primeira campanha para começar a enviar mensagens em massa para seus contatos
            </p>

            <Link
                href="/dashboard/campaigns/"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-all"
            >
                <Plus className="w-5 h-5" />
                Criar Primeira Campanha
            </Link>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                <div className="bg-accent/50 rounded-lg p-4">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-sm font-medium">Escreva sua mensagem</p>
                </div>
                <div className="bg-accent/50 rounded-lg p-4">
                    <div className="text-3xl mb-2">👥</div>
                    <p className="text-sm font-medium">Selecione os contatos</p>
                </div>
                <div className="bg-accent/50 rounded-lg p-4">
                    <div className="text-3xl mb-2">🚀</div>
                    <p className="text-sm font-medium">Envie em massa</p>
                </div>
            </div>
        </div>
    )
}
