import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { AdminPushToggle } from '@/components/admin/AdminPushToggle'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'
import ProtectedRoute from '@/components/ProtectedRoute'
import { LayoutDashboard } from 'lucide-react'
// We might want an AdminRoute guard, but ProtectedRoute + Middleware checks role too?
// Frontend-side role check is good.

// Manifest próprio (não o da app principal) — pra "Adicionar à tela de início" abrir
// direto aqui, com nome/ícone diferentes do app dos corretores.
export const metadata: Metadata = {
    title: 'ZapBroker Admin',
    manifest: '/admin-manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black',
        title: 'ZB Admin',
    },
}

export const viewport: Viewport = {
    themeColor: '#09090b',
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Ideally we wrap with <AdminGuard> here
    return (
        <ProtectedRoute>
            <div className="flex flex-col lg:flex-row bg-zinc-950 h-screen overflow-hidden text-zinc-100 font-sans">
                <AdminSidebar />
                <main className="flex-1 overflow-y-auto h-full relative scrollbar-hide pb-nav-safe lg:pb-0">
                    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10 w-full">
                        <h2 className="font-semibold text-zinc-100">Painel Administrativo</h2>
                        <div className="flex items-center gap-3">
                            <AdminPushToggle />
                            <div className="flex lg:hidden items-center gap-1 border-l border-zinc-800 pl-3">
                                <Link
                                    href="/dashboard"
                                    title="Voltar ao App"
                                    className="flex items-center justify-center size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                    <LayoutDashboard className="size-4" />
                                </Link>
                                <AdminLogoutButton />
                            </div>
                        </div>
                    </header>
                    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
