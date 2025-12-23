"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
    {
        name: "Rafael Silva",
        role: "Corretor SP",
        title: "Triplicou minhas vendas em 2 meses",
        content:
            "Antes eu mandava 50 msgs/dia manualmente. Agora mando 300 automaticamente e fecho 3x mais vendas.",
        rating: 5,
    },
    {
        name: "Mariana Costa",
        role: "Corretora RJ",
        title: "Recuperei 3h por dia",
        content:
            "Eu odiava perder tempo no zap. Agora o Zapbroker faz isso enquanto eu visito imóveis.",
        rating: 5,
    },
    {
        name: "Carlos Mendes",
        role: "Corretor MG",
        title: "Nunca fui banido",
        content:
            "Testei 3 ferramentas, todas me baniram. Zapbroker há 5 meses, zero problemas.",
        rating: 5,
    },
    {
        name: "Ana Souza",
        role: "Corretora SC",
        title: "Simplesmente funciona",
        content:
            "A interface é linda e fácil de usar. Em 5 minutos configurei tudo e comecei a disparar.",
        rating: 5,
    },
    {
        name: "Roberto Lima",
        role: "Imobiliária Prime",
        title: "Suporte excelente",
        content:
            "Tive uma dúvida no domingo e me responderam em 5 minutos. Equipe nota 10.",
        rating: 5,
    },
    {
        name: "Fernanda Olive",
        role: "Corretora BA",
        title: "Mudou meu jogo",
        content:
            "A personalização com IA faz toda a diferença. Os clientes realmente respondem.",
        rating: 5,
    },
];

export function TestimonialsSection() {
    return (
        <section className="bg-gray-50 dark:bg-slate-900 py-16 lg:py-24 transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white lg:text-5xl">
                        O Que Corretores Estão Dizendo
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {TESTIMONIALS.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-sm transition-shadow hover:shadow-md border border-transparent dark:border-slate-700"
                        >
                            <div className="mb-4 flex gap-1">
                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-5 w-5 fill-[#D4AF37] text-[#D4AF37]"
                                    />
                                ))}
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                                &quot;{testimonial.title}&quot;
                            </h3>
                            <p className="mb-6 text-gray-600 dark:text-gray-300">{testimonial.content}</p>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700" />
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
