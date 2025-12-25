"use client"

import Link from "next/link"
import { BrandLogo } from "@/components/BrandLogo"
import { Instagram, Linkedin, Globe, MessageCircle } from "lucide-react"

export default function LinksPage() {
    const links = [
        {
            title: "Começar Teste Grátis (7 Dias)",
            href: "/signup",
            variant: "primary",
            icon: null
        },
        {
            title: "Acessar Dashboard",
            href: "/login",
            variant: "secondary",
            icon: null
        },
        {
            title: "Falar no WhatsApp",
            href: "https://wa.me/5551989194794",
            variant: "outline",
            icon: <MessageCircle className="w-4 h-4" />
        },
        {
            title: "Visitar Site Oficial",
            href: "/",
            variant: "ghost",
            icon: <Globe className="w-4 h-4" />
        }
    ]

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-16 px-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 grid-pattern opacity-[0.03] dark:opacity-[0.1] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-brand-purple-500/5 to-transparent pointer-events-none z-0" />

            <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-8 relative z-10">
                {/* Header / Profile */}
                <div className="flex flex-col items-center text-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 shadow-xl shadow-brand-purple-500/10 ring-1 ring-black/5 dark:ring-white/10">
                        <BrandLogo className="h-10 w-auto text-brand-purple-600" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight">ZapBroker</h1>
                        <p className="text-sm text-muted-foreground">Sua central de automação imobiliária 🚀</p>
                    </div>
                </div>

                {/* Links Stack */}
                <div className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    {links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.href}
                            target={link.href.startsWith('http') ? '_blank' : undefined}
                            className={`
                                relative group w-full py-3.5 px-6 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2
                                ${link.variant === 'primary'
                                    ? 'bg-gradient-to-r from-brand-purple-600 to-brand-purple-500 text-white shadow-lg shadow-brand-purple-500/25 hover:shadow-brand-purple-500/40 hover:-translate-y-0.5'
                                    : ''}
                                ${link.variant === 'secondary'
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    : ''}
                                ${link.variant === 'outline'
                                    ? 'border border-zinc-200 dark:border-zinc-800 hover:border-brand-purple-500/50 hover:bg-brand-purple-50 dark:hover:bg-brand-purple-900/10 text-muted-foreground hover:text-foreground'
                                    : ''}
                                ${link.variant === 'ghost'
                                    ? 'text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                    : ''}
                            `}
                        >
                            {link.icon}
                            {link.title}
                        </Link>
                    ))}
                </div>

                {/* Socials */}
                <div className="flex items-center gap-4 mt-4 animate-in fade-in duration-700 delay-300">
                    <a href="#" className="p-2 text-muted-foreground hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/10 rounded-full transition-colors">
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a href="#" className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-full transition-colors">
                        <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="#" className="p-2 text-muted-foreground hover:text-brand-purple-600 hover:bg-brand-purple-50 dark:hover:bg-brand-purple-900/10 rounded-full transition-colors">
                        <Globe className="w-5 h-5" />
                    </a>
                </div>

                {/* Footer */}
                <footer className="mt-8 text-center animate-in fade-in duration-700 delay-500">
                    <p className="text-[10px] text-muted-foreground opacity-50">
                        © {new Date().getFullYear()} ZapBroker Inc.
                    </p>
                </footer>
            </div>
        </div>
    )
}
