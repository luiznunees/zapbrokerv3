import { Star } from "lucide-react"

const TESTIMONIALS = [
    {
        quote: "Recuperei clientes que estavam há semanas sem responder. Hoje minha taxa de visitas aumentou muito.",
        author: "Carlos Souza",
        role: "Corretor há 12 anos",
    },
    {
        quote: "O agente é demais! Ele lembra dos leads por mim e eu só aprovo. Ganhei tempo e meus resultados cresceram.",
        author: "Juliana Mendes",
        role: "Imobiliária Alto Padrão",
    },
    {
        quote: "Simples de usar, direto no WhatsApp e sem complicação. Recomendo pra todo corretor.",
        author: "Rafael Lima",
        role: "Corretor de Imóveis",
    },
]

export function Testimonials() {
    return (
        <section className="py-10 md:py-14 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-10">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Quem usa, recomenda</p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Corretores que já vendem mais com o ZapBroker
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="bg-white border border-border p-5 rounded-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-black text-primary text-xs shrink-0">
                                    {t.author.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">{t.author}</h4>
                                    <p className="text-xs text-muted-foreground">{t.role}</p>
                                </div>
                            </div>

                            <div className="flex gap-0.5 mb-2">
                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3.5 h-3.5 fill-primary text-primary" />)}
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed">"{t.quote}"</p>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-1.5 mt-6">
                    {TESTIMONIALS.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-primary/20'}`} />
                    ))}
                </div>
            </div>
        </section>
    )
}
