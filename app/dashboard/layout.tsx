import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex bg-background min-h-screen text-foreground transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                    <h2 className="font-semibold text-foreground">Dashboard do Corretor</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground">
                            AS
                        </div>
                    </div>
                </header>
                <div className="p-8 max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
