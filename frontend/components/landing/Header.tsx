"use client"

import { useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Menu, X } from 'lucide-react'

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BrandLogo className="h-8 w-auto" />
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link>
                    <Link href="#pricing" className="hover:text-primary transition-colors">Preços</Link>
                    <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    <ThemeToggle />
                    <Link
                        href="/login"
                        className="px-4 py-2 border border-primary text-primary rounded-xl font-medium hover:bg-primary/5 transition-colors"
                    >
                        Entrar
                    </Link>
                    <Link
                        href="/signup"
                        className="px-4 py-2 bg-gradient-to-r from-brand-green-500 to-brand-green-600 text-white rounded-xl font-bold shadow-lg shadow-brand-green-500/20 hover:opacity-90 transition-opacity"
                    >
                        Teste Grátis
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4 animate-in slide-in-from-top-4">
                    <Link href="#features" className="text-sm font-medium p-2" onClick={() => setIsMenuOpen(false)}>Funcionalidades</Link>
                    <Link href="#pricing" className="text-sm font-medium p-2" onClick={() => setIsMenuOpen(false)}>Preços</Link>
                    <Link href="#faq" className="text-sm font-medium p-2" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
                    <div className="flex flex-col gap-2 mt-2">
                        <Link
                            href="/login"
                            className="w-full text-center px-4 py-2 border border-primary text-primary rounded-xl font-medium"
                        >
                            Entrar
                        </Link>
                        <Link
                            href="/signup"
                            className="w-full text-center px-4 py-2 bg-gradient-to-r from-brand-green-500 to-brand-green-600 text-white rounded-xl font-bold"
                        >
                            Começar Teste Grátis
                        </Link>
                    </div>
                </div>
            )}
        </header>
    )
}
