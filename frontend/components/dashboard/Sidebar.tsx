
"use client"

import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Send, Users, Settings, LogOut, BookOpen, Lightbulb, Search, HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

const NAV_ITEMS = [
    {
        group: 'Principal',
        items: [
            { name: 'Visão Geral', icon: LayoutDashboard, href: '/dashboard' },
            { name: 'Leads', icon: Users, href: '/dashboard/leads' },
            { name: 'Campanhas', icon: Send, href: '/dashboard/campaigns' },
        ]
    },
    {
        group: 'Conteúdo',
        items: [
            { name: 'Tutoriais', icon: BookOpen, href: '/dashboard/tutorials' },
            { name: 'Sugestões', icon: Lightbulb, href: '/dashboard/suggestions' },
        ]
    }
]

const BOTTOM_ITEMS = [
    { name: 'Ajuda', icon: HelpCircle, href: '/dashboard/support' },
]

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

export default function Sidebar() {
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { user } = await import('@/services/api').then(m => m.api.auth.profile())
                setUser(user)
            } catch (error) {
                console.error('Failed to fetch profile for sidebar', error)
            }
        }
        fetchProfile()
    }, [])

    const getInitials = (name: string) => {
        if (!name) return 'U'
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    const pathname = usePathname()
    const [searchQuery, setSearchQuery] = useState('')

    // Flatten items for search
    const allItems = [...NAV_ITEMS.flatMap(g => g.items), ...BOTTOM_ITEMS, { name: 'Configurações', icon: Settings, href: '/dashboard/settings' }]

    // Filter items based on search
    const filteredItems = searchQuery
        ? allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : null

    const userName = user?.nome || user?.name || 'Carregando...'
    const planName = user?.planName || 'Consultando plano...'

    return (
        <aside className="w-60 bg-card/95 border-r border-border flex flex-col min-h-screen transition-all duration-300 shadow-xl z-20">
            {/* Top Profile Section */}
            <div className="p-3 pb-1">
                <div className="flex items-center justify-center mb-4 mt-2">
                    <BrandLogo className="h-6 w-auto text-foreground dark:text-white" monochrome />
                </div>

                {/* Quick Action / Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-accent/50 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                    />
                </div>
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar">

                {searchQuery ? (
                    <div className="space-y-0.5">
                        <h4 className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-1.5">Resultados</h4>
                        {filteredItems && filteredItems.length > 0 ? (
                            filteredItems.map(item => (
                                <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                            ))
                        ) : (
                            <p className="px-3 text-xs text-muted-foreground">Nada encontrado.</p>
                        )}
                    </div>
                ) : (
                    <>
                        {NAV_ITEMS.map((group, idx) => (
                            <div key={idx} className="space-y-0.5">
                                <h4 className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-1">{group.group}</h4>
                                {group.items.map((item) => (
                                    <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                                ))}
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border mt-auto bg-card">
                {/* User Profile - Dynamic */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-md shadow-primary/20">
                        <span className="font-bold text-white text-xs">{getInitials(userName)}</span>
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="font-bold text-foreground text-xs truncate">{userName}</h3>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">{planName}</p>
                    </div>
                </div>

                {!searchQuery && (
                    <div className="space-y-0.5">
                        {BOTTOM_ITEMS.map((item) => (
                            <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                        ))}
                        <div className="my-1.5 border-t border-border/50" />
                        <NavItem item={{ name: 'Configurações', icon: Settings, href: '/dashboard/settings' }} isActive={pathname === '/dashboard/settings'} />

                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                window.location.href = '/login';
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Sair
                        </button>
                    </div>
                )}
            </div>
        </aside>
    )
}

function NavItem({ item, isActive }: { item: any, isActive: boolean }) {
    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 group relative overflow-hidden",
                isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
        >
            <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
            <span className="relative z-10">{item.name}</span>
            {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />}
        </Link>
    )
}


