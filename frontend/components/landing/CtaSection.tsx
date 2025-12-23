"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

export function CtaSection() {
    return (
        <section className="relative overflow-hidden bg-gradient-royal py-20 lg:py-32">
            {/* Background Pattern */}
            <div className="bg-pattern-house absolute inset-0 opacity-10 mix-blend-overlay" />

            <div className="container relative mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-4xl"
                >
                    {/* Floating Badge */}
                    <div className="mb-8 inline-block animate-bounce rounded-full bg-white px-4 py-2 font-bold text-[#D4AF37] shadow-lg">
                        ⚡ Últimas 12 vagas para teste grátis hoje
                    </div>

                    <h2 className="mb-8 text-3xl font-bold text-white lg:text-5xl">
                        Pronto Para Vender Mais Trabalhando Menos?
                    </h2>
                    <p className="mb-10 text-xl text-blue-100">
                        Junte-se a 967 corretores que já automatizaram seus disparos e
                        triplicaram suas vendas.
                    </p>

                    <button className="group inline-flex items-center justify-center rounded-2xl bg-success px-10 py-5 text-xl font-bold text-white shadow-xl shadow-success/25 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-success/40">
                        Começar Teste Grátis de 7 Dias
                        <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </button>

                    <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-blue-200">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4" /> Sem cartão
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4" /> Cancele quando quiser
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4" /> Suporte VIP
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
