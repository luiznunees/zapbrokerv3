"use client"

import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Ticket, Settings, LogOut, ShieldAlert, BarChart3, Link as LinkIcon, DollarSign, MessageSquareHeart, Terminal } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useState, useEffect } from 'react'
import { logoutUser } from '@/lib/supabase'

const ADMIN_NAV_ITEMS = [
    {
        group: 'Gestão',
        items: [
            { name: 'Dashboard', icon: BarChart3, href: '/admin' },
            { name: 'Financeiro', icon: DollarSign, href: '/admin/finance' },
            { name: 'Usuários', icon: Users, href: '/admin/users' },
            { name: 'Invites / Freemium', icon: LinkIcon, href: '/admin/invites' },
            { name: 'Feedback do Beta', icon: MessageSquareHeart, href: '/admin/feedback' },
        ]
    },
    {
        group: 'Sistema',
        items: [
            { name: 'System Logs', icon: ShieldAlert, href: '/admin/logs' },
            { name: 'Log Bruto', icon: Terminal, href: '/admin/activity-logs' },
            { name: 'Configurações', icon: Settings, href: '/admin/settings' },
        ]
    }
]

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

export default function AdminSidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            // We can reuse the same profile fetch or assume layout passed it?
            // For simplicity, fetch again or read from local storage if needed
            // But layout is safer.
        }
    }, [])

    const allItems = ADMIN_NAV_ITEMS.flatMap(g => g.items)

    return (
        <>
            {/* Mobile: barra fixa de ícones embaixo — a versão anterior era w-60/min-h-screen
                sem nenhuma variante mobile, então no celular a sidebar ocupava a tela toda
                antes mesmo de mostrar o conteúdo. Mesmo padrão do NavRail do app principal. */}
            <nav className="flex lg:hidden items-center justify-around fixed bottom-0 inset-x-0 z-30 bg-zinc-900 border-t border-zinc-800 px-1 pb-safe shadow-xl">
                {allItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={item.name}
                            className={cn(
                                "flex items-center justify-center size-11 rounded-xl transition-colors shrink-0",
                                isActive ? "bg-primary/10 text-primary" : "text-zinc-400 hover:text-zinc-100"
                            )}
                        >
                            <item.icon className="size-5" />
                        </Link>
                    )
                })}
            </nav>

            {/* Desktop: sidebar vertical completa, como antes */}
            <aside className="hidden lg:flex w-60 bg-zinc-900 border-r border-zinc-800 flex-col min-h-screen transition-all duration-300 shadow-xl z-20 text-zinc-100">
                {/* Top Profile Section */}
                <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2 mb-4 mt-2">
                        <BrandLogo className="h-6 w-auto text-white" monochrome />
                        <span className="text-xs font-bold bg-gradient-to-r from-primary to-sky-500 px-2 py-0.5 rounded text-white">ADMIN</span>
                    </div>
                </div>

                {/* Navigation Groups */}
                <div className="flex-1 overflow-y-auto px-3 space-y-6 pt-6 custom-scrollbar">
                    {ADMIN_NAV_ITEMS.map((group, idx) => (
                        <div key={idx} className="space-y-0.5">
                            <h4 className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{group.group}</h4>
                            {group.items.map((item) => (
                                <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-zinc-800 mt-auto bg-zinc-900">
                    <Link href="/dashboard" className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors mb-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Voltar ao App
                    </Link>

                    <button
                        onClick={() => logoutUser()}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-900/10 transition-colors group"
                    >
                        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Sair
                    </button>
                </div>
            </aside>
        </>
    )
}

function NavItem({ item, isActive }: { item: any, isActive: boolean }) {
    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 group relative overflow-hidden",
                isActive
                    ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            )}
        >
            <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-zinc-400 group-hover:text-zinc-100")} />
            <span className="relative z-10">{item.name}</span>
        </Link>
    )
}
