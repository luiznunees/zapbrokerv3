"use client"
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav
            className={cn(
                "fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] left-0 right-0 z-50 flex items-center justify-between",
                scrolled
                    ? "top-4 mx-auto max-w-5xl rounded-full border border-primary/20 bg-background/60 backdrop-blur-xl shadow-2xl py-2 px-6 shadow-primary/5"
                    : "top-0 w-full border-b border-border/0 bg-transparent py-4 px-6 sm:px-12"
            )}
        >
            <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className={cn("font-bold text-xl transition-colors", scrolled ? "text-foreground" : "text-foreground")}>
                    ZapBroker
                </span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
                <ThemeToggle />
                <Link
                    href="/login"
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block"
                >
                    Login
                </Link>
                <Link
                    href="/waitlist"
                    className={cn(
                        "rounded-full font-medium transition-all text-sm shadow-lg",
                        scrolled
                            ? "bg-primary text-primary-foreground px-4 py-1.5 hover:bg-primary/90"
                            : "bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm px-5 py-2 hover:bg-primary hover:text-primary-foreground"
                    )}
                >
                    Entrar na Lista
                </Link>
            </div>
        </nav>
    )
}
