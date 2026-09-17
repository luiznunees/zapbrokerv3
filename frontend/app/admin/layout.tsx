import type { Metadata, Viewport } from 'next'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { AdminPushToggle } from '@/components/admin/AdminPushToggle'
import ProtectedRoute from '@/components/ProtectedRoute'
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
                <main className="flex-1 overflow-y-auto h-full relative scrollbar-hide pb-20 lg:pb-0">
                    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10 w-full">
                        <h2 className="font-semibold text-zinc-100">Painel Administrativo</h2>
                        <AdminPushToggle />
                    </header>
                    <div className="p-6 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
