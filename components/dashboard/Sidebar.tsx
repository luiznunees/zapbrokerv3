"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Send, Users, Settings, LogOut, Sparkles, Ghost, Zap, BarChart3, Bot } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ThemeToggle } from '@/components/ThemeToggle'

const navItems = [
    { name: 'Visão Geral', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Leads (Kanban)', icon: LayoutDashboard, href: '/dashboard/leads' },
    { name: 'Seu Estagiário (AI)', icon: Bot, href: '/dashboard/ai-agent' },
    { name: 'Campanhas', icon: BarChart3, href: '/dashboard/campaigns' },
    { name: 'Speed-to-Lead', icon: Zap, href: '/dashboard/tools/speed-to-lead' },
    { name: 'Configurações', icon: Settings, href: '/dashboard/settings' },
]

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-card border-r border-border flex flex-col min-h-screen transition-colors duration-300">
            <div className="h-16 flex items-center px-6 border-b border-border">
                <span className="text-primary text-xl mr-2">⚡</span>
                <span className="font-bold text-foreground text-lg">ZapBroker</span>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Tema</span>
                    <ThemeToggle />
                </div>
                <button className="flex items-center gap-3 w-full px-3 py-2.5 text-muted-foreground hover:text-destructive text-sm font-medium transition-colors">
                    <LogOut className="w-5 h-5" />
                    Sair
                </button>
            </div>
        </aside>
    )
}
