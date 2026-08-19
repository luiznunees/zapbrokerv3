"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Send, Settings,
  LogOut, Plus, Wifi,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/contexts/dashboard-context"
import { BrandIcon } from "@/components/BrandLogo"
import { logoutUser } from "@/lib/supabase"

const NAV_ITEMS = [
  { icon: LayoutDashboard, href: "/dashboard", label: "Painel" },
  { icon: Users, href: "/dashboard/leads", label: "Leads" },
  { icon: Send, href: "/dashboard/campaigns", label: "Campanhas" },
  { icon: Wifi, href: "/dashboard/connection", label: "Conectar WhatsApp" },
  // Loja de Extras oculta temporariamente — página em app/dashboard/loja/page.tsx continua intacta.
]

export function NavRail() {
  const pathname = usePathname()
  const { triggerNewChat } = useDashboard()

  return (
    <nav
      className={cn(
        "flex items-center shrink-0 z-30 bg-white border-zinc-200 shadow-sm",
        // Mobile: fixed bottom tab bar
        "fixed bottom-0 inset-x-0 flex-row justify-around w-full h-16 rounded-t-3xl border-t px-2",
        // Desktop (lg+): vertical rail on the left
        "lg:static lg:flex-col lg:justify-start lg:items-center lg:py-4 lg:gap-1.5 lg:w-16 lg:h-[calc(100vh-24px)] lg:my-3 lg:ml-3 lg:rounded-3xl lg:border lg:px-0"
      )}
    >
      <Link
        href="/dashboard"
        title="ZapBroker"
        className="hidden lg:flex items-center justify-center size-10 rounded-2xl hover:bg-primary/5 transition-all mb-1"
      >
        <BrandIcon className="h-6" />
      </Link>

      <div className="hidden lg:block w-8 h-px bg-zinc-200 my-1.5" />

      <button
        onClick={triggerNewChat}
        title="Novo Chat"
        className="hidden lg:flex items-center justify-center size-10 rounded-2xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
      >
        <Plus className="size-5" />
      </button>

      <div className="hidden lg:block flex-1" />

      <div className="flex items-center gap-1 lg:flex-col">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center justify-center size-10 rounded-2xl transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <item.icon className="size-5" />
            </Link>
          )
        })}
      </div>

      <div className="hidden lg:block flex-1" />

      <div className="flex items-center gap-1 lg:flex-col">
        <Link
          href="/dashboard/settings"
          title="Configurações"
          className={cn(
            "flex items-center justify-center size-10 rounded-2xl transition-all",
            pathname === "/dashboard/settings"
              ? "bg-primary/10 text-primary"
              : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
          )}
        >
          <Settings className="size-5" />
        </Link>

        <button
          onClick={() => logoutUser()}
          title="Sair"
          className="flex items-center justify-center size-10 rounded-2xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all lg:mt-1"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </nav>
  )
}
