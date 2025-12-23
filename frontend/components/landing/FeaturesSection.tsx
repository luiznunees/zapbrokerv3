"use client";

import { motion } from "framer-motion";
import { BarChart3, Bot, Clock, FileText, Smartphone, ShieldCheck } from "lucide-react";

const FEATURES = [
    {
        icon: Bot,
        title: "IA que Personaliza Automaticamente",
        description: "Cada mensagem é única. Inclui nome, cidade, tipo de imóvel procurado. Taxa de resposta 3x maior.",
    },
    {
        icon: ShieldCheck,
        title: "Sistema Anti-Ban Inteligente",
        description: "Aquece seu chip gradualmente. Delay aleatório entre msgs. 967 corretores, 0 banimentos.",
    },
    {
        icon: BarChart3,
        title: "Analytics em Tempo Real",
        description: "Veja quantas mensagens foram entregues, lidas, respondidas. Tome decisões baseadas em dados.",
    },
    {
        icon: Clock,
        title: "Agendamento Inteligente",
        description: "Agende campanhas para melhor horário. Sistema envia automaticamente.",
    },
    {
        icon: FileText,
        title: "Templates Prontos",
        description: "+50 templates específicos para corretores. Só personalizar e disparar.",
    },
    {
        icon: Smartphone,
        title: "Suporte Rápido",
        description: "Respondemos em menos de 10min. WhatsApp, email, chat ao vivo. Você nunca fica sozinho.",
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="relative overflow-hidden bg-gradient-royal py-16 lg:py-24">
            <div className="bg-pattern-house absolute inset-0 opacity-5" />

            <div className="container relative mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold text-white lg:text-5xl">
                        Por Que 967 Corretores Escolheram o Zapbroker
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-dark group rounded-xl p-8 transition-all hover:-translate-y-1 hover:bg-white/10"
                        >
                            <div className="mb-6 inline-flex rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] p-3 text-white shadow-lg">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-4 text-xl font-bold text-white">{feature.title}</h3>
                            <p className="text-blue-100/80 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
