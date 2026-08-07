"use client"

import { useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { Menu, X, ArrowUpRight } from 'lucide-react'

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full bg-landing-navy/95 backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto max-w-6xl px-4 md:px-6">
                <div className="flex items-center justify-between h-16">
                    <BrandLogo className="h-6 w-auto text-white" monochrome />

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-white/60">
                        <Link href="#features" className="hover:text-white transition-colors">Funcionalidades</Link>
                        <Link href="#pricing" className="hover:text-white transition-colors">Preços</Link>
                        <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-5">
                        <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                            Login
                        </Link>
                        <Link
                            href="#pricing"
                            className="group flex items-center gap-2 pl-5 pr-2 py-2 bg-landing-lime text-landing-navy rounded-full font-bold text-sm hover:bg-landing-lime-dark transition-colors"
                        >
                            Assinar agora
                            <span className="flex items-center justify-center size-6 rounded-full bg-landing-navy text-landing-lime group-hover:rotate-45 transition-transform">
                                <ArrowUpRight className="size-3.5" />
                            </span>
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mb-4 rounded-2xl border border-white/10 bg-landing-ink p-4 flex flex-col gap-1 animate-in slide-in-from-top-4 shadow-xl">
                        <Link href="#features" className="text-sm font-bold p-3 rounded-xl text-white hover:bg-white/5" onClick={() => setIsMenuOpen(false)}>Funcionalidades</Link>
                        <Link href="#pricing" className="text-sm font-bold p-3 rounded-xl text-white hover:bg-white/5" onClick={() => setIsMenuOpen(false)}>Preços</Link>
                        <Link href="#faq" className="text-sm font-bold p-3 rounded-xl text-white hover:bg-white/5" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
                        <div className="flex flex-col gap-2 mt-2">
                            <Link href="/login" className="w-full text-center px-4 py-2.5 border border-white/15 text-white rounded-full font-bold">
                                Login
                            </Link>
                            <Link href="#pricing" className="w-full text-center px-4 py-2.5 bg-landing-lime text-landing-navy rounded-full font-bold">
                                Assinar agora
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
