import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { KanbanMockup } from "./KanbanMockup"

export function MockupSection() {
    return (
        <section className="py-8 bg-card border-y border-border overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-5 md:gap-8 items-center max-w-4xl mx-auto">

                    {/* Rendered Mockup */}
                    <div className="relative rounded-lg overflow-hidden shadow-2xl shadow-brand-purple-900/10 border border-white/5 bg-zinc-900 aspect-[4/3] group ring-1 ring-white/10">
                        <KanbanMockup />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-1.5 text-foreground">
                                É Mais do Que<br /> Disparo em Massa
                            </h2>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Sistema completo de gestão de leads, campanhas, follow-up automático e relatórios de conversão. Tudo que você precisa em um só lugar.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            {[
                                "Kanban de Leads integrado",
                                "Múltiplos números de WhatsApp",
                                "Gestão de Equipes (Corretores)"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="p-0.5 rounded-full bg-brand-green-100 dark:bg-brand-green-900/40 text-brand-green-600">
                                        <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                    <span className="font-medium text-xs">{item}</span>
                                </div>
                            ))}
                        </div>

                        <Link
                            href="/signup"
                            className="inline-flex h-8 items-center justify-center rounded-md bg-brand-purple-600 px-3 text-xs font-medium text-white shadow transition-colors hover:bg-brand-purple-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            Testar Gratuitamente →
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
