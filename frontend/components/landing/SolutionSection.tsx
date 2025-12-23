"use client";

import { motion } from "framer-motion";
import { Bot, Rocket, Smartphone } from "lucide-react";

const STEPS = [
    {
        icon: Smartphone,
        title: "Conecta seu WhatsApp",
        description: "Escaneie QR Code em 30seg e conecte.",
    },
    {
        icon: Bot,
        title: "IA Personaliza as Mensagens",
        description:
            "Baseado no perfil do contato, a IA cria mensagens únicas para cada pessoa.",
    },
    {
        icon: Rocket,
        title: "Dispara 500+ por Dia",
        description: "Automático, com delay inteligente e zero risco de ban.",
    },
];

export function SolutionSection() {
    return (
        <section
            id="how-it-works"
            className="bg-background py-16 lg:py-24 transition-colors duration-300"
        >
            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
                        Como o Zapbroker Resolve Isso em{" "}
                        <span className="text-gradient-gold">3 Passos</span>
                    </h2>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-[50px] left-[10%] right-[10%] h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

                    <div className="grid gap-8 lg:grid-cols-3">
                        {STEPS.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.3 }}
                                className="relative flex flex-col items-center text-center"
                            >
                                <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 shadow-inner">
                                    <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg">
                                        {index + 1}
                                    </div>
                                    <step.icon className="h-10 w-10 text-primary" />
                                </div>

                                <h3 className="mb-3 text-xl font-bold text-foreground">
                                    {step.title}
                                </h3>
                                <p className="max-w-xs text-lg text-muted-foreground">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
