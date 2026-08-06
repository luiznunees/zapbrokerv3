import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { KanbanMockup } from "./KanbanMockup"

export function MockupSection() {
    return (
        <section className="py-10 md:py-14 bg-[#f6f4f1] overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center max-w-4xl mx-auto">

                    {/* Rendered Mockup */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 aspect-[4/3] group -rotate-1 hover:rotate-0 transition-transform duration-300">
                        <KanbanMockup />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2 text-[#0a0a0a] uppercase">
                                É Mais do Que<br /> Disparo em Massa
                            </h2>
                            <p className="text-sm text-[#6f6b76] leading-relaxed">
                                Sistema completo de gestão de leads, campanhas, follow-up automático e relatórios de conversão. Tudo que você precisa em um só lugar.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {[
                                "Kanban de Leads integrado",
                                "Múltiplos números de WhatsApp",
                                "Gestão de Equipes (Corretores)"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="p-0.5 rounded-full bg-[#8A5BF5]/10 text-[#8A5BF5]">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-bold text-sm text-[#0a0a0a]">{item}</span>
                                </div>
                            ))}
                        </div>

                        <Link
                            href="#pricing"
                            className="inline-flex h-11 items-center justify-center rounded-full bg-[#8A5BF5] px-6 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            Assinar agora →
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
