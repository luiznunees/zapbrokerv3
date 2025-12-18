import { HelpCircle } from 'lucide-react'

const faqs = [
    {
        q: "Preciso saber programar?",
        a: "Zero. O ZapBroker foi feito para corretores, não para programadores. Se você sabe usar o WhatsApp, sabe usar nossa ferramenta."
    },
    {
        q: "Funciona no celular?",
        a: "Sim! Nossa plataforma é 100% responsiva. Você pode disparar campanhas e responder leads direto do seu iPhone ou Android."
    },
    {
        q: "Vou ter meu WhatsApp bloqueado?",
        a: "Não. Utilizamos uma tecnologia exclusiva de 'Aquecimento de Chip' e atrasos aleatórios que simulam o comportamento humano, protegendo seu número."
    },
    {
        q: "Tem fidelidade?",
        a: "Nenhuma. Você assina mensalmente e pode cancelar quando quiser, sem multas ou letras miúdas. Confiamos no nosso taco."
    }
]

export default function FAQ() {
    return (
        <section className="py-24 bg-card border-t border-border">
            <div className="mx-auto max-w-4xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4 flex justify-center items-center gap-2">
                        <HelpCircle className="text-primary w-8 h-8" /> Dúvidas Frequentes
                    </h2>
                    <p className="text-muted-foreground">
                        Tiramos o risco das suas costas.
                    </p>
                </div>

                <div className="grid gap-6">
                    {faqs.map((f, i) => (
                        <div key={i} className="p-6 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors">
                            <h3 className="text-lg font-bold text-foreground mb-2">{f.q}</h3>
                            <p className="text-muted-foreground">{f.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
