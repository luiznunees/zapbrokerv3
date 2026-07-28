import { Check } from "lucide-react"
import Link from "next/link"
import { DoodleArrowDown } from "./Doodle"

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

export function Pricing() {
    return (
        <section id="pricing" className="py-10 md:py-14 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-10 relative">
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2 text-[#0a0a0a] uppercase">
                        Planos Simples, Sem Pegadinhas
                    </h2>
                    <p className="text-sm text-[#6f6b76]">
                        Escolha o plano ideal para o seu volume de captação. Pagamento via PIX, ativação imediata.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto items-start">
                    {PLANS.map((plan, i) => (
                        <div
                            key={i}
                            className={`
                                relative p-6 rounded-3xl transition-transform hover:-translate-y-1
                                ${plan.featured
                                    ? 'bg-[#145c3b] text-white rotate-1'
                                    : 'bg-[#f6f4f1] text-[#0a0a0a] -rotate-1'
                                }
                            `}
                        >
                            {plan.featured && (
                                <>
                                    <div className="absolute -top-3 left-6 bg-[#d4a054] text-[#0a0a0a] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        Mais Escolhido
                                    </div>
                                    <DoodleArrowDown className="hidden md:block absolute -top-10 right-4 w-10 h-10 text-[#d4a054] rotate-[200deg]" />
                                </>
                            )}

                            <div className="mb-5">
                                <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${plan.featured ? 'text-white/50' : 'text-[#6f6b76]'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-sm font-bold ${plan.featured ? 'text-white/50' : 'text-[#6f6b76]'}`}>R$</span>
                                    <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                                    <span className={`text-sm ${plan.featured ? 'text-white/50' : 'text-[#6f6b76]'}`}>/mês</span>
                                </div>
                                <p className={`text-xs mt-1 ${plan.featured ? 'text-white/50' : 'text-[#6f6b76]'}`}>Mensal via PIX, cancele quando quiser</p>
                            </div>

                            <ul className="space-y-2.5 mb-6">
                                {plan.features.map((feature, j) => (
                                    <li key={j} className="flex items-start gap-2.5 text-sm">
                                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.featured ? 'text-[#d4a054]' : 'text-[#0e9f6e]'}`} />
                                        <span className={plan.featured ? 'text-white/85' : 'text-[#37343e]'}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`/signup?planId=${plan.id}`}
                                className={`
                                    w-full py-3 rounded-full font-black text-sm text-center transition-colors block
                                    ${plan.featured
                                        ? 'bg-[#d4a054] hover:brightness-110 text-[#0a0a0a]'
                                        : 'bg-[#0a0a0a] hover:bg-[#2a2a2a] text-white'
                                    }
                                `}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-[#6f6b76] text-center">
                    <span>✓ Pagamento via PIX</span>
                    <span>✓ Cancele quando quiser</span>
                    <span>✓ Suporte rápido</span>
                </div>
            </div>
        </section>
    )
}
