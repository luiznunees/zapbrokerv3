"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-gradient-royal pb-16 pt-24 lg:pb-24 lg:pt-32">
            {/* Background Pattern */}
            <div className="bg-pattern-house absolute inset-0 opacity-10 mix-blend-overlay" />

            {/* Container */}
            <div className="container relative mx-auto px-4">
                <div className="grid gap-8 lg:grid-cols-2 lg:items-center">

                    {/* Left Column: Copy */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-white"
                    >
                        <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                            <span className="mr-2 text-lg">🏆</span>
                            <span className="text-sm font-medium text-white">
                                +967 corretores já automatizaram
                            </span>
                        </div>

                        <h1 className="mb-6 text-3xl font-bold leading-tight tracking-tight lg:text-5xl">
                            Feche Mais Vendas <br />
                            <span className="text-gradient-gold">Trabalhando MENOS</span> <br />
                            no WhatsApp
                        </h1>

                        <p className="mb-8 text-lg text-blue-100 lg:text-xl">
                            Automação com IA que envia 500+ mensagens personalizadas por dia
                            enquanto você foca em fechar.
                        </p>

                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Link
                                href="#pricing"
                                className="group inline-flex items-center justify-center rounded-2xl bg-success px-8 py-4 text-lg font-bold text-white shadow-lg shadow-success/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-success/40"
                            >
                                Começar Teste Grátis
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="#how-it-works"
                                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/10"
                            >
                                Ver como funciona
                            </Link>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-4 text-sm text-blue-200">
                            <div className="flex items-center">
                                <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                                Sem cartão de crédito
                            </div>
                            <div className="flex items-center">
                                <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                                Cancele quando quiser
                            </div>
                            <div className="flex items-center">
                                <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                                Setup em 5 minutos
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Illustration */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative lg:h-[600px]"
                    >
                        {/* Abstract 3D Representation */}
                        <div className="relative z-10 mx-auto aspect-square w-full max-w-md lg:max-w-none">
                            <div className="absolute inset-0 animate-float-slow rounded-[3rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-600/20 rounded-2xl blur-3xl animate-pulse-slow"></div>

                                {/* Mock Interface Details */}
                                <div className="absolute inset-4 rounded-[2.5rem] bg-[#0f172a] overflow-hidden flex flex-col">
                                    {/* Header */}
                                    <div className="h-16 border-b border-white/10 flex items-center px-6 gap-3">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    {/* Body */}
                                    <div className="flex-1 p-6 space-y-4">
                                        <div className="h-8 w-1/3 bg-white/10 rounded animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="h-20 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 shrink-0"></div>
                                                <div className="space-y-2 w-full">
                                                    <div className="h-3 w-1/4 bg-blue-500/40 rounded"></div>
                                                    <div className="h-2 w-3/4 bg-blue-500/20 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="h-20 bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-3 opacity-50">
                                                <div className="w-8 h-8 rounded-full bg-white/10 shrink-0"></div>
                                                <div className="space-y-2 w-full">
                                                    <div className="h-3 w-1/4 bg-white/20 rounded"></div>
                                                    <div className="h-2 w-1/2 bg-white/10 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="h-20 bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-3 opacity-30">
                                                <div className="w-8 h-8 rounded-full bg-white/10 shrink-0"></div>
                                                <div className="space-y-2 w-full">
                                                    <div className="h-3 w-1/4 bg-white/20 rounded"></div>
                                                    <div className="h-2 w-2/3 bg-white/10 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Floating Stats */}
                                    <div className="absolute bottom-6 right-6 bg-success text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg animate-bounce">
                                        +153 Leads Hoje 🚀
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-10 -right-10 h-24 w-24 animate-float-slow rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center delay-1000">
                                <span className="text-4xl">📱</span>
                            </div>
                            <div className="absolute -bottom-5 -left-5 h-20 w-20 animate-float-slow rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 shadow-xl flex items-center justify-center delay-500">
                                <span className="text-3xl">🤖</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Wave Divider */}
            <div className="absolute bottom-0 w-full leading-none text-white dark:text-background transition-colors duration-300">
                <svg className="block w-full h-[60px] lg:h-[100px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
                </svg>
            </div>
        </section>
    );
}
