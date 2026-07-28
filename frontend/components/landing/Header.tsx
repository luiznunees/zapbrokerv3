"use client"

import { useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { Menu, X } from 'lucide-react'

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="sticky top-4 z-50 w-full px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="flex items-center justify-between rounded-full border border-white/10 bg-[#0f2e1f]/90 backdrop-blur-md pl-3 pr-2 py-2 shadow-[0_8px_30px_rgba(8,40,25,0.35)]">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-full bg-white pl-3 pr-1 py-1">
                            <BrandLogo className="h-6 w-auto" />
                            <span className="rounded-full bg-[#d4a054] text-[#0a0a0a] text-[11px] font-black uppercase px-2.5 py-1 tracking-wide">
                                Zap
                            </span>
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1 text-sm font-bold text-white/80">
                        <Link href="#features" className="px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition-colors">Funcionalidades</Link>
                        <Link href="#pricing" className="px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition-colors">Preços</Link>
                        <Link href="#faq" className="px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition-colors">FAQ</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            href="/login"
                            className="px-4 py-2 text-white/80 rounded-full font-bold text-sm hover:bg-white/10 hover:text-white transition-colors"
                        >
                            Entrar
                        </Link>
                        <Link
                            href="#pricing"
                            className="px-5 py-2 bg-[#d4a054] text-[#0a0a0a] rounded-full font-black text-sm hover:brightness-110 transition-all"
                        >
                            Assinar agora
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-2 rounded-3xl border border-white/10 bg-[#0f2e1f] p-4 flex flex-col gap-1 animate-in slide-in-from-top-4 shadow-xl">
                        <Link href="#features" className="text-sm font-bold p-3 rounded-2xl text-white hover:bg-white/10" onClick={() => setIsMenuOpen(false)}>Funcionalidades</Link>
                        <Link href="#pricing" className="text-sm font-bold p-3 rounded-2xl text-white hover:bg-white/10" onClick={() => setIsMenuOpen(false)}>Preços</Link>
                        <Link href="#faq" className="text-sm font-bold p-3 rounded-2xl text-white hover:bg-white/10" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
                        <div className="flex flex-col gap-2 mt-2">
                            <Link
                                href="/login"
                                className="w-full text-center px-4 py-2.5 border border-white/20 text-white rounded-full font-bold"
                            >
                                Entrar
                            </Link>
                            <Link
                                href="#pricing"
                                className="w-full text-center px-4 py-2.5 bg-[#d4a054] text-[#0a0a0a] rounded-full font-black"
                            >
                                Assinar agora
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
