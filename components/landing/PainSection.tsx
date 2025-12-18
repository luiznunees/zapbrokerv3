import { XCircle, Clock, MessageSquareX } from 'lucide-react'

export default function PainSection() {
    return (
        <section className="py-24 bg-card border-y border-border">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
                        A dura realidade do Corretor em 2024
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Se você se identifica com isso, o ZapBroker foi feito para você.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-colors">
                        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                            <Clock className="w-6 h-6 text-destructive" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3">O Lead Esfria em 5 Minutos</h3>
                        <p className="text-muted-foreground">
                            Você demora 1 hora para responder porque estava em visita. Quando responde, o cliente já fechou com outro ou não lembra mais de você.
                        </p>
                    </div>

                    <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-colors">
                        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                            <MessageSquareX className="w-6 h-6 text-destructive" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3">O Fantasma do "Vácuo"</h3>
                        <p className="text-muted-foreground">
                            Você envia opções, fotos, vídeos... e o cliente simplesmente para de responder. Você gasta energia e não recebe nem um "obrigado".
                        </p>
                    </div>

                    <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-colors">
                        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-6 h-6 text-destructive" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3">Leads Desqualificados</h3>
                        <p className="text-muted-foreground">
                            Passa o dia atendendo curiosos que não têm orçamento ou só estão "pesquisando". Seu tempo vale dinheiro, pare de desperdiçá-lo.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
