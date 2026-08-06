import { Check, QrCode, RefreshCw, Headset } from "lucide-react"
import Link from "next/link"

const PLANS = [
    {
        id: "starter",
        name: "Starter",
        price: "39",
        features: [
            "5 disparos por mês",
            "500 leads",
            "2 conexões WhatsApp",
            "Suporte prioritário"
        ],
        cta: "Assinar Starter",
        featured: false
    },
    {
        id: "pro",
        name: "Pro",
        price: "79",
        features: [
            "Disparos ilimitados",
            "Leads ilimitados",
            "5 conexões WhatsApp",
            "Suporte VIP"
        ],
        cta: "Assinar Pro",
        featured: true
    }
]

const TRUST_BADGES = [
    { icon: QrCode, label: "Pagamento via PIX" },
    { icon: RefreshCw, label: "Cancele quando quiser" },
    { icon: Headset, label: "Suporte rápido e humano" },
]

export function Pricing() {
    return (
        <section id="pricing" className="py-10 md:py-14 bg-[#f8f7fc]">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-10">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Planos simples, sem pegadinhas</p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-foreground">
                        Escolha o plano ideal para você
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Pagamento via PIX, ativação imediata, cancele quando quiser.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto items-start">
                    {PLANS.map((plan, i) => (
                        <div
                            key={i}
                            className={`
                                relative p-6 rounded-3xl transition-transform hover:-translate-y-1
                                ${plan.featured
                                    ? 'bg-gradient-to-br from-primary to-indigo-500 text-white shadow-xl'
                                    : 'bg-white border border-border text-foreground'
                                }
                            `}
                        >
                            {plan.featured && (
                                <div className="absolute -top-3 right-6 bg-white text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
                                    Mais Escolhido
                                </div>
                            )}

                            <div className="mb-5">
                                <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${plan.featured ? 'text-white/60' : 'text-muted-foreground'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-sm font-bold ${plan.featured ? 'text-white/60' : 'text-muted-foreground'}`}>R$</span>
                                    <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                                    <span className={`text-sm ${plan.featured ? 'text-white/60' : 'text-muted-foreground'}`}>/mês</span>
                                </div>
                                <p className={`text-xs mt-1 ${plan.featured ? 'text-white/60' : 'text-muted-foreground'}`}>Mensal via PIX, cancele quando quiser</p>
                            </div>

                            <ul className="space-y-2.5 mb-6">
                                {plan.features.map((feature, j) => (
                                    <li key={j} className="flex items-start gap-2.5 text-sm">
                                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.featured ? 'text-white' : 'text-primary'}`} />
                                        <span className={plan.featured ? 'text-white/90' : 'text-foreground/80'}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`/signup?planId=${plan.id}`}
                                className={`
                                    w-full py-3 rounded-full font-black text-sm text-center transition-colors block
                                    ${plan.featured
                                        ? 'bg-white hover:bg-white/90 text-primary'
                                        : 'border-2 border-primary text-primary hover:bg-primary/5'
                                    }
                                `}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground font-medium">
                    {TRUST_BADGES.map((badge, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <badge.icon className="w-3.5 h-3.5 text-primary" /> {badge.label}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
