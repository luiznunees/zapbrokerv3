import { Star, Quote } from 'lucide-react'

const testimonials = [
    {
        name: "Ricardo Mendes",
        role: "Top Producer @ Remax",
        image: "/avatars/male.png",
        content: "Eu perdia 4h por dia qualificando leads no WhatsApp. Com o ZapBroker, eu só falo com quem quer comprar. Meu VGV dobrou em 3 meses."
    },
    {
        name: "Fernanda Lima",
        role: "Diretora Comercial",
        image: "/avatars/female.png",
        content: "A função de 'Anti-Ghosting' é surreal. Recuperamos clientes que não respondiam há semanas. Simplesmente obrigatório."
    },
    {
        name: "Carlos Andrade",
        role: "Investidor Imobiliário",
        image: "/avatars/investor.png",
        content: "Uso para gerenciar meus próprios imóveis. A organização visual do funil me dá clareza total sobre minhas negociações."
    }
]

export default function SocialProof() {
    return (
        <section className="py-24 bg-background">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
                        A Arma Secreta dos Top Producers
                    </h2>
                    <p className="text-muted-foreground">
                        Junte-se a corretores que estão dominando o mercado digital.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div key={i} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 relative shadow-lg hover:shadow-xl group">
                            <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
                            <div className="flex gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-muted-foreground mb-6 italic relative z-10">"{t.content}"</p>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors">
                                    <img src={t.image} alt={t.name} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">{t.name}</h4>
                                    <p className="text-sm text-primary font-medium">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
