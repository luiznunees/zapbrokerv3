"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const PLANS = [
    {
        name: "BÁSICO",
        price: "R$ 29",
        period: "/mensal",
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
        name: "PLUS",
        price: "R$ 69",
        period: "/mensal",
        badge: "🏆 MAIS POPULAR",
        features: [
            "125 msgs/semana",
            "2 conexões WhatsApp",
            "Tudo do Básico +",
            "Analytics avançado",
            "Templates premium",
            "Suporte prioritário",
        ],
        highlight: true,
    },
    {
        name: "PRO",
        price: "R$ 119",
        period: "/mensal",
        features: [
            "250 msgs/semana",
            "5 conexões WhatsApp",
            "Tudo do Plus +",
            "API access",
            "White label",
            "Suporte VIP",
            "Gerente de conta",
        ],
        highlight: false,
    },
];

export function PricingSection() {
    return (
        <section
            id="pricing"
            className="bg-background py-16 lg:py-24 transition-colors duration-300"
        >
            <div className="container mx-auto px-4">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
                        Escolha Seu Plano
                    </h2>
                    <p className="mt-4 text-base text-muted-foreground">
                        Todos os planos incluem 7 dias de teste grátis
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 lg:items-center">
                    {PLANS.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className={`relative flex flex-col rounded-xl p-6 shadow-md transition-transform ${plan.highlight
                                ? "bg-white dark:bg-slate-800 scale-105 border-2 border-[#D4AF37] shadow-xl lg:-mt-4 lg:mb-4"
                                : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:scale-[1.02]"
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#D4AF37] px-3 py-0.5 text-xs font-bold text-white shadow-md">
                                    {plan.badge}
                                </div>
                            )}

                            <div className="mb-6 text-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {plan.name}
                                </h3>
                                <div className="mt-2 flex items-baseline justify-center">
                                    <span className="text-3xl font-extrabold text-[#1E40AF] dark:text-blue-400">
                                        {plan.price}
                                    </span>
                                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                                        {plan.period}
                                    </span>
                                </div>
                            </div>

                            <ul className="mb-6 flex-1 space-y-3 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center text-gray-600 dark:text-gray-300"
                                    >
                                        <Check className="mr-2 h-4 w-4 text-success" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full rounded-lg py-3 text-center text-sm font-bold transition-all hover:scale-[1.02] ${plan.highlight
                                    ? "bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-white shadow-md hover:shadow-lg"
                                    : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600"
                                    }`}
                            >
                                Começar Teste Grátis
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-8 space-y-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    <p>✓ Todos planos: 7 dias grátis, sem cartão</p>
                    <p>✓ Cancele quando quiser, sem burocracia</p>
                    <p>✓ Garantia de 30 dias ou seu dinheiro de volta</p>
                </div>
            </div>
        </section>
    );
}
