"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

interface BioLink {
    href: string
    icon: ReactNode
    title: string
    desc: string
    primary?: boolean
    external?: boolean
}

export function BioLinks({ links }: { links: BioLink[] }) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <div className="w-full max-w-sm flex flex-col gap-3 mb-8">
            {links.map((link, i) => (
                <motion.div
                    key={link.title}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: i * 0.06 }}
                >
                    <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className={
                            link.primary
                                ? "group flex items-center gap-3 rounded-2xl px-5 py-4 bg-landing-lime hover:bg-landing-lime-dark text-landing-navy transition-colors text-left"
                                : "group flex items-center gap-3 rounded-2xl px-5 py-4 bg-white/8 hover:bg-white/14 border border-white/15 text-white transition-colors text-left"
                        }
                    >
                        {link.icon}
                        <span className="flex-1">
                            <span className="block font-bold text-sm">{link.title}</span>
                            <span className={`block text-xs mt-0.5 ${link.primary ? "text-landing-navy/70" : "text-white/60"}`}>
                                {link.desc}
                            </span>
                        </span>
                        <ArrowUpRight className="w-4 h-4 shrink-0 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </motion.div>
            ))}
        </div>
    )
}
