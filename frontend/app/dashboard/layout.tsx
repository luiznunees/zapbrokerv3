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
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-md shadow-primary/20">
                                        <span className="font-bold text-white text-xs">AS</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-foreground text-xs truncate">Anderson Silva</h3>
                                        <p className="text-[10px] text-muted-foreground font-medium truncate">Corretor Pro</p>
                                    </div>
                                </div>
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
