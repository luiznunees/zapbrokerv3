import { NavRail } from '@/components/dashboard/NavRail'
import { DashboardProvider } from '@/contexts/dashboard-context'
import { UserProvider } from '@/contexts/user-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import PaymentGuard from '@/components/auth/PaymentGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <UserProvider>
        <PaymentGuard>
          <DashboardProvider>
            <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-zinc-50 text-foreground transition-colors duration-300">
              <NavRail />
              <main className="flex-1 overflow-y-auto h-full relative pb-20 lg:pb-0">
                <div className="p-4 pt-3 h-full">{children}</div>
              </main>
            </div>
          </DashboardProvider>
        </PaymentGuard>
      </UserProvider>
    </ProtectedRoute>
  )
}
