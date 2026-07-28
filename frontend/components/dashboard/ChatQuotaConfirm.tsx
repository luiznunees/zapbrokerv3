"use client"

import { useState } from "react"
import { AlertTriangle, Check } from "lucide-react"

interface ChatQuotaConfirmProps {
  purpose?: string
  onConfirm: () => void
  disabled?: boolean
}

export function ChatQuotaConfirm({ purpose, onConfirm, disabled }: ChatQuotaConfirmProps) {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm()
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
        <AlertTriangle className="size-4" />
        Última campanha do mês
      </div>
      <p className="text-xs text-foreground/80">
        Esse disparo vai usar sua última campanha disponível este mês no seu plano atual.
      </p>

      <button
        onClick={handleConfirm}
        disabled={disabled || confirmed}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <Check className="size-4" />
        {confirmed ? "Confirmado" : "Continuar mesmo assim"}
      </button>
    </div>
  )
}
