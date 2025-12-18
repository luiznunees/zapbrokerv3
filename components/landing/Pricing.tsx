import { Check, Zap } from 'lucide-react'
import Link from 'next/link'

const plans = [
    {
        name: "Starter",
        price: "Grátis",
        description: "Para corretores iniciantes que querem testar a água.",
        features: [
            "Até 50 Leads/mês",
            "Dashboard Básico",
            "Envio Manual de Mensagens",
            "Suporte via Email"
        ],
        cta: "Começar Grátis",
        popular: false
    },
    {
        name: "Top Producer",
        price: "R$ 97,90",
        period: "/mês",
        description: "A máquina completa para escalar suas vendas.",
        features: [
            "Leads Ilimitados",
            "Speed-to-Lead (Atendimento em 5s)",
            "Anti-Ghosting Automático",
            "Gerador de Copy com IA",
            "Suporte Prioritário WhatsApp"
        ],
        cta: "Garantir Preço de Lançamento",
        popular: true
    }
]

export default function Pricing() {
    return (
        <section className="py-24 bg-background border-t border-border">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
                        Investimento que se paga na 1ª Venda
                    </h2>
                    <p className="text-muted-foreground">
                        Escolha o plano ideal para o seu momento de carreira.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, i) => (
                        <div key={i} className={`relative p-8 rounded-2xl border ${plan.popular ? 'border-primary bg-primary/5 shadow-2xl' : 'border-border bg-card'} transition-all hover:scale-105 duration-300`}>
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                    <Zap className="w-4 h-4 fill-current" /> Mais Escolhido
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                            </div>
                            <p className="text-muted-foreground mb-8">{plan.description}</p>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, f) => (
                                    <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Link href="/waitlist" className={`block w-full py-3 px-6 rounded-lg text-center font-bold transition-colors ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'}`}>
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
