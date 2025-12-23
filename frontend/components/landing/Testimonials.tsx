import { Star, Quote } from "lucide-react"

const TESTIMONIALS = [
    {
        quote: "Antes eu mandava 30-40 mensagens por dia manualmente. Agora disparo 300 automaticamente e agendo 3x mais visitas.",
        author: "Rafael Silva",
        role: "Corretor em São Paulo, SP"
    },
    {
        quote: "Eu odiava perder tempo digitando no WhatsApp. Agora o ZapBroker faz isso enquanto eu faço visitas e atendo clientes. Produtividade absurda.",
        author: "Mariana Costa",
        role: "Corretora no Rio de Janeiro, RJ"
    },
    {
        quote: "Testei outras ferramentas e fui banido 2x. ZapBroker há 5 meses, mandando 400 msgs/dia, zero problemas. Sistema anti-ban funciona mesmo.",
        author: "Carlos Mendes",
        role: "Corretor em Belo Horizonte, MG"
    },
    {
        quote: "Personalizei as mensagens com IA, mandei pra leads qualificados e captei 3 exclusivas na mesma semana. ROI absurdo.",
        author: "Ana Santos",
        role: "Corretora em Curitiba, PR"
    }
]

export function Testimonials() {
    return (
        <section className="py-8 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-6">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                        Histórias Reais de Sucesso
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Corretores que multiplicaram suas captações com automação.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-2 lg:gap-3 max-w-3xl mx-auto">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="bg-card border border-border p-3 rounded-lg relative overflow-hidden group hover:border-brand-purple-500/30 transition-all">
                            <Quote className="absolute top-2 right-2 w-5 h-5 text-brand-purple-100 dark:text-brand-purple-900/20 transform rotate-12" />

                            <div className="flex gap-0.5 mb-2">
                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
                            </div>

                            <p className="text-xs font-medium italic mb-2.5 leading-relaxed relative z-10 text-foreground/90">"{t.quote}"</p>

                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-purple-400 to-brand-blue flex items-center justify-center font-bold text-white text-[9px] shadow-md">
                                    {t.author.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-[10px] text-foreground">{t.author}</h4>
                                    <p className="text-[8px] text-muted-foreground">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
