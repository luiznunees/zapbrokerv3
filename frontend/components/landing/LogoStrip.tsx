"use client";

import { motion } from "framer-motion";
import { Building2, Home, Key, Landmark, ShieldCheck } from "lucide-react";

const COMPANIES = [
    { name: "Imobiliária Prime", icon: Building2 },
    { name: "Casa Nova", icon: Home },
    { name: "Secure Home", icon: ShieldCheck },
    { name: "Chave de Ouro", icon: Key },
    { name: "Lux Estate", icon: Landmark },
    // Duplicate for seamless loop
    { name: "Imobiliária Prime", icon: Building2 },
    { name: "Casa Nova", icon: Home },
    { name: "Secure Home", icon: ShieldCheck },
    { name: "Chave de Ouro", icon: Key },
    { name: "Lux Estate", icon: Landmark },
];

export function LogoStrip() {
    return (
        <section className="bg-background py-12 transition-colors duration-300">
            <div className="container mx-auto px-4 text-center">
                <p className="mb-8 text-sm font-medium text-muted-foreground">
                    CORRETORES QUE JÁ CONFIAM NO ZAPBROKER:
                </p>

                <div className="relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
                    <motion.div
                        animate={{
                            x: ["0%", "-50%"],
                        }}
                        transition={{
                            duration: 20,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                        className="flex flex-none gap-12 pr-12 lg:gap-24 lg:pr-24"
                    >
                        {COMPANIES.map((company, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 dark:brightness-125 dark:hover:brightness-150"
                            >
                                <company.icon className="h-8 w-8 text-primary" />
                                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                    {company.name}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
