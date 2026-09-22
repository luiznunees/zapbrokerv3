"use client"

import { LogOut } from "lucide-react"
import { logoutUser } from "@/lib/supabase"

export function AdminLogoutButton() {
    return (
        <button
            onClick={() => logoutUser('/zbteam')}
            title="Sair"
            className="flex items-center justify-center size-8 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-900/10 transition-colors"
        >
            <LogOut className="size-4" />
        </button>
    )
}
