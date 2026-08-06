"use client"

import { useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { Menu, X } from 'lucide-react'

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border">
            <div className="container mx-auto max-w-6xl px-4 md:px-6">
                <div className="flex items-center justify-between h-16">
                    <BrandLogo className="h-6 w-auto" />

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-foreground/70">
                        <Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link>
                        <Link href="#pricing" className="hover:text-primary transition-colors">Preços</Link>
                        <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
                            Login
                        </Link>
                        <Link
                            href="#pricing"
                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:bg-primary/90 transition-colors"
                        >
                            Assinar agora
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden p-2 text-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mb-4 rounded-2xl border border-border bg-white p-4 flex flex-col gap-1 animate-in slide-in-from-top-4 shadow-xl">
                        <Link href="#features" className="text-sm font-bold p-3 rounded-xl text-foreground hover:bg-primary/5" onClick={() => setIsMenuOpen(false)}>Funcionalidades</Link>
                        <Link href="#pricing" className="text-sm font-bold p-3 rounded-xl text-foreground hover:bg-primary/5" onClick={() => setIsMenuOpen(false)}>Preços</Link>
                        <Link href="#faq" className="text-sm font-bold p-3 rounded-xl text-foreground hover:bg-primary/5" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
                        <div className="flex flex-col gap-2 mt-2">
                            <Link href="/login" className="w-full text-center px-4 py-2.5 border border-border text-foreground rounded-full font-bold">
                                Login
                            </Link>
                            <Link href="#pricing" className="w-full text-center px-4 py-2.5 bg-primary text-primary-foreground rounded-full font-bold">
                                Assinar agora
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
