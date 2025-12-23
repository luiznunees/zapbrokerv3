import Sidebar from '@/components/dashboard/Sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import PaymentGuard from '@/components/auth/PaymentGuard'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            <PaymentGuard>
                <div className="flex bg-background h-screen overflow-hidden text-foreground transition-colors duration-300">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto h-full relative">
                        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-10 w-full">
                            <h2 className="font-semibold text-foreground">Dashboard do Corretor</h2>
                            <div className="flex items-center gap-2">
                                {/* User profile removed as requested */}
                            </div>
                        </header>
                        <div className="p-6 max-w-6xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </PaymentGuard>
        </ProtectedRoute>
    )
}
