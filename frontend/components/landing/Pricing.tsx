import { Check, X } from "lucide-react"
import Link from "next/link"

const PLANS = [
    {
        id: "prod_ZxwseRQWbKLxHKsnfcUCMfYc",
        name: "Básico",
        price: "29",
        perMsg: "0,58",
        features: [
            "50 msgs/semana",
            "1 conexão WhatsApp",
            "IA Personalizável",
            "Sistema Anti-Ban",
            "Relatórios básicos",
            "Suporte por email"
        ],
        cta: "Começar Teste Grátis",
        highlight: false
    },
    {
        id: "prod_n6CMApuNhHqPCUrL2JmHyWbz",
        name: "Plus",
        price: "69",
        perMsg: "0,69",
        features: [
            "100 msgs/semana",
            "2 conexões WhatsApp",
            "Tudo do Básico +",
            "Analytics avançado",
            "Templates premium",
            "Agendamento",
            "Suporte prioritário"
        ],
        cta: "Começar Teste Grátis",
        highlight: true
    },
    {
        id: "prod_AXPStPBEeB5xrpubKyWB6EnY",
        name: "Pro",
        price: "119",
        perMsg: "0,48",
        features: [
            "250 msgs/semana",
            "5 conexões WhatsApp",
            "Tudo do Plus +",
            "API Access",
            "Webhooks",
            "Suporte VIP",
            "Gerente de conta"
        ],
        cta: "Começar Teste Grátis",
        highlight: false
    }
]

export function Pricing() {
    return (
        <section id="pricing" className="py-8 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-6">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                        Planos Simples, Sem Pegadinhas
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Escolha o plano ideal para o seu volume de captação. Todos incluem 7 dias grátis para testar.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-2 max-w-3xl mx-auto items-start">
                    {PLANS.map((plan, i) => (
                        <div
                            key={i}
                            className={`
                                relative p-3 rounded-lg border bg-card transition-all duration-300
                                ${plan.highlight
                                    ? 'border-brand-purple-500 shadow-xl shadow-brand-purple-500/10 scale-105 z-10'
                                    : 'border-border hover:border-brand-purple-500/50 hover:shadow-lg'
                                }
                            `}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-purple-500 text-white px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider">
                                    🏆 Mais Escolhido
                                </div>
                            )}

                            <div className="mb-2.5">
                                <h3 className="text-xs font-bold mb-0.5">{plan.name}</h3>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-[10px] font-medium text-muted-foreground">R$</span>
                                    <span className="text-2xl font-bold tracking-tight">{plan.price}</span>
                                    <span className="text-muted-foreground text-[10px]">/sem</span>
                                </div>
                                <p className="text-[8px] text-muted-foreground mt-0.5">~R$ {plan.perMsg} por msg</p>
                            </div>

                            <Link
                                href={`/login?planId=${plan.id}`}
                                className={`
                                    w-full py-1.5 rounded-md font-bold text-[10px] text-center transition-colors block mb-3
                                    ${plan.highlight
                                        ? 'bg-brand-green-500 hover:bg-brand-green-600 text-white shadow-lg shadow-brand-green-500/20'
                                        : 'border border-brand-purple-500 text-brand-purple-500 hover:bg-brand-purple-50 dark:hover:bg-brand-purple-900/20'
                                    }
                                `}
                            >
                                {plan.cta}
                            </Link>

                            <ul className="space-y-1.5">
                                {plan.features.map((feature, j) => (
                                    <li key={j} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                                        <Check className="w-3 h-3 text-brand-green-500 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground text-center">
                    <span>✓ 7 dias grátis em todos os planos</span>
                    <span>✓ Sem cartão de crédito</span>
                    <span>✓ Cancele quando quiser</span>
                </div>
            </div>
        </section>
    )
}
