"use client";

import { motion } from "framer-motion";
import { Check, ShieldCheck, Zap, Rocket, Crown } from "lucide-react";
import { useRouter } from "next/navigation";

const PLANS = [
    {
        id: "prod_ZxwseRQWbKLxHKsnfcUCMfYc",
        name: "Básico",
        price: "29",
        perMsg: "0,58",
        icon: Zap,
        features: [
            "50 msgs/semana",
            "1 conexão WhatsApp",
            "IA Personalizável",
            "Anti-ban",
            "Suporte email",
        ],
        highlight: false,
    },
    {
        id: "prod_n6CMApuNhHqPCUrL2JmHyWbz",
        name: "Plus",
        price: "69",
        perMsg: "0,69",
        icon: Rocket,
        badge: "🏆 RECOMENDADO",
        features: [
            "100 msgs/semana",
            "2 conexões WhatsApp",
            "Tudo do Básico +",
            "Analytics avançado",
            "Templates premium",
            "Suporte prioritário",
        ],
        highlight: true,
    },
    {
        id: "prod_AXPStPBEeB5xrpubKyWB6EnY",
        name: "Pro",
        price: "119",
        perMsg: "0,48",
        icon: Crown,
        features: [
            "250 msgs/semana",
            "5 conexões WhatsApp",
            "Tudo do Plus +",
            "API access",
            "White label",
            "Gerente de conta",
        ],
        highlight: false,
    },
];

export default function UpgradePage() {
    const router = useRouter();

    const handleSelectPlan = (planId: string) => {
        router.push(`/checkout/redirect?planId=${planId}`);
    };

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-foreground mb-4">
                        Escolha o seu Plano
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Para continuar acessando o dashboard e automatizando suas vendas, selecione o plano que melhor se adapta às suas necessidades.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {PLANS.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex flex-col rounded-2xl p-8 shadow-lg border-2 transition-all ${plan.highlight
                                    ? "bg-card border-brand-purple-500 scale-105 z-10 shadow-brand-purple-500/10"
                                    : "bg-card border-border hover:border-brand-purple-500/50"
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {plan.badge}
                                </div>
                            )}

                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <plan.icon className={`h-8 w-8 ${plan.highlight ? 'text-brand-purple-500' : 'text-muted-foreground'}`} />
                                    <h3 className="text-xl font-bold">{plan.name}</h3>
                                </div>
                                <div className="flex items-baseline mb-2">
                                    <span className="text-4xl font-black text-foreground">R$ {plan.price}</span>
                                    <span className="text-muted-foreground ml-2 text-sm">/semana</span>
                                </div>
                                <p className="text-xs text-muted-foreground italic">~R$ {plan.perMsg} por mensagem enviada</p>
                            </div>

                            <ul className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start text-sm text-foreground/80">
                                        <Check className="h-5 w-5 text-brand-green-500 mr-2 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan.id)}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 ${plan.highlight
                                        ? "bg-brand-purple-600 hover:bg-brand-purple-700 text-white shadow-xl shadow-brand-purple-600/20"
                                        : "bg-secondary hover:bg-secondary/80 text-foreground"
                                    }`}
                            >
                                Selecionar Plano
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 bg-muted/30 rounded-3xl p-8 border border-border/50 text-center">
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-brand-green-500" />
                            <div className="text-left">
                                <p className="text-sm font-bold">7 Dias Grátis</p>
                                <p className="text-[10px] text-muted-foreground">Teste todas as ferramentas sem compromisso.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Zap className="h-6 w-6 text-brand-purple-500" />
                            <div className="text-left">
                                <p className="text-sm font-bold">Sem Fidelidade</p>
                                <p className="text-[10px] text-muted-foreground">Cancele ou altere seu plano a qualquer momento.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-muted-foreground">
                    Ao assinar, você concorda com nossos Termos de Uso e Política de Privacidade.
                </p>
            </div>
        </div>
    );
}
