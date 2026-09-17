"use client"

import { useState } from "react"
import { Bell, BellRing, Loader2 } from "lucide-react"
import { usePush } from "@/hooks/usePush"

export function AdminPushToggle() {
    const { supported, permission, subscribed, subscribe, loading } = usePush()
    const [justActivated, setJustActivated] = useState(false)

    if (!supported) return null

    const active = subscribed || permission === "granted"

    if (active) {
        return (
            <span
                title="Notificações ativadas neste dispositivo"
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-400"
            >
                <BellRing className="size-3.5" />
                <span className="hidden sm:inline">{justActivated ? "Ativado!" : "Notificações ativas"}</span>
            </span>
        )
    }

    const handleClick = async () => {
        const ok = await subscribe()
        if (ok) setJustActivated(true)
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            title="Ativar notificações neste dispositivo (novo cadastro, etc.)"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50"
        >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />}
            <span className="hidden sm:inline">Ativar notificações</span>
        </button>
    )
}
