import AdminSidebar from '@/components/admin/AdminSidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
// We might want an AdminRoute guard, but ProtectedRoute + Middleware checks role too?
// Frontend-side role check is good.

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Ideally we wrap with <AdminGuard> here
    return (
        <ProtectedRoute>
            <div className="flex bg-zinc-950 h-screen overflow-hidden text-zinc-100 font-sans">
                <AdminSidebar />
                <main className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
                    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10 w-full">
                        <h2 className="font-semibold text-zinc-100">Painel Administrativo</h2>
                    </header>
                    <div className="p-6 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
