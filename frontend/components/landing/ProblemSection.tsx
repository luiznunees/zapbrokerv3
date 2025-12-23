"use client";

import { motion } from "framer-motion";

const PROBLEMS = [
    {
        emoji: "😩",
        title: 'Perco 4h por dia mandando "oi tudo bem" no WhatsApp',
        description:
            "Enquanto isso, seus concorrentes automatizaram e mandam 10x mais mensagens.",
    },
    {
        emoji: "🚫",
        title: "Meu número foi banido do WhatsApp por enviar muito",
        description:
            "Você perde sua base de contatos e precisa começar do zero. Prejuízo enorme.",
    },
    {
        emoji: "📉",
        title: "Mando msgs mas ninguém responde",
        description:
            "Mensagens genéricas não funcionam. Clientes ignoram 'oi' de corretor.",
    },
];

export function ProblemSection() {
    return (
        <section className="bg-blue-50 dark:bg-slate-900 py-16 lg:py-24 transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                        Você Reconhece Esses Problemas?
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {PROBLEMS.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md border border-transparent dark:border-slate-700"
                        >
                            <div className="mb-4 text-5xl">{problem.emoji}</div>
                            <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
                                &quot;{problem.title}&quot;
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {problem.description}
                            </p>

                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
