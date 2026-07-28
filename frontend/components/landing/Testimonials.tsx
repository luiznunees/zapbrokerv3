import { Star, Quote } from "lucide-react"
import Image from "next/image"

const TESTIMONIALS = [
    {
        quote: "Antes eu mandava 30-40 mensagens por dia manualmente. Agora disparo 300 automaticamente e agendo 3x mais visitas.",
        author: "Rafael Silva",
        role: "Corretor em São Paulo, SP",
        image: "/testimonials/rafael-silva.png"
    },
    {
        quote: "Eu odiava perder tempo digitando no WhatsApp. Agora o ZapBroker faz isso enquanto eu faço visitas e atendo clientes. Produtividade absurda.",
        author: "Mariana Costa",
        role: "Corretora no Rio de Janeiro, RJ",
        image: "/testimonials/mariana-costa.png"
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
        <section className="py-10 md:py-14 bg-[#f6f4f1]">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-10">
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2 text-[#0a0a0a] uppercase">
                        Histórias Reais de Sucesso
                    </h2>
                    <p className="text-sm text-[#6f6b76]">
                        Corretores que multiplicaram suas captações com automação.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-3 lg:gap-4 max-w-3xl mx-auto">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className={`bg-white p-5 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all ${i % 2 === 0 ? 'md:rotate-1' : 'md:-rotate-1'} hover:rotate-0`}>
                            <Quote className="absolute top-3 right-3 w-6 h-6 text-[#e4e1dc] transform rotate-12" />

                            <div className="flex gap-0.5 mb-2.5">
                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-[#145c3b] text-[#145c3b]" />)}
                            </div>

                            <p className="text-sm font-medium italic mb-3 leading-relaxed relative z-10 text-[#37343e]">"{t.quote}"</p>

                            <div className="flex items-center gap-2.5">
                                {t.image ? (
                                    <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm relative">
                                        <Image
                                            src={t.image}
                                            alt={t.author}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-[#145c3b] flex items-center justify-center font-black text-[#d4a054] text-xs">
                                        {t.author.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-black text-xs text-[#0a0a0a]">{t.author}</h4>
                                    <p className="text-[11px] text-[#6f6b76]">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
