"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
    {
        question: "O Zapbroker é seguro? Vou ser banido?",
        answer:
            "Não. Nosso sistema usa delay inteligente e aquecimento gradual do chip. 967 corretores usam há meses sem ban.",
    },
    {
        question: "Preciso de conhecimento técnico?",
        answer:
            "Zero. Se você sabe usar WhatsApp, sabe usar Zapbroker. Setup leva 5 minutos.",
    },
    {
        question: "Funciona no meu celular?",
        answer: "Sim! Web, Android, iOS. Acesse de qualquer lugar.",
    },
    {
        question: "Posso cancelar quando quiser?",
        answer: "Sim. Sem multa, sem burocracia. Cancele com 1 clique.",
    },
    {
        question: "E se eu não gostar?",
        answer: "7 dias grátis + garantia de 30 dias. Risco zero.",
    },
    {
        question: "Quantas mensagens posso enviar?",
        answer:
            "Depende do plano: 50, 100 ou 250 por semana. Cota renova toda segunda.",
    },
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section
            id="faq"
            className="bg-background py-16 lg:py-24 transition-colors duration-300"
        >
            <div className="container mx-auto max-w-3xl px-4">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
                        Perguntas Frequentes
                    </h2>
                </div>

                <div className="space-y-3">
                    {FAQS.map((faq, index) => (
                        <div
                            key={index}
                            className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300"
                        >
                            <button
                                onClick={() => toggle(index)}
                                className="flex w-full items-center justify-between p-5 text-left"
                            >
                                <span className="text-base font-bold text-[#1E3A8A] dark:text-blue-400">
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <Minus className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <Plus className="h-5 w-5 text-gray-500" />
                                )}
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="p-5 pt-0 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
