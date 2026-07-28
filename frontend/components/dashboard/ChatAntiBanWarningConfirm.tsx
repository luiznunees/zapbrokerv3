"use client"

import { useState } from "react"
import { AlertTriangle, ShieldCheck } from "lucide-react"

interface ChatAntiBanWarningConfirmProps {
  purpose?: string
  onConfirm: () => void
  disabled?: boolean
}

function parseLeadCount(purpose?: string): number {
  if (!purpose) return 0
  try {
    return Number(JSON.parse(purpose).leadCount) || 0
  } catch {
    return 0
  }
}

export function ChatAntiBanWarningConfirm({ purpose, onConfirm, disabled }: ChatAntiBanWarningConfirmProps) {
  const leadCount = parseLeadCount(purpose)
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm()
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
        <AlertTriangle className="size-4" />
        Risco de bloqueio no WhatsApp
      </div>
      <p className="text-xs text-foreground/80">
        Essa lista tem <strong>{leadCount} leads</strong> e você escolheu só <strong>1 número</strong> pra enviar.
        Disparar um volume grande por um único WhatsApp aumenta bastante a chance de bloqueio.
      </p>
      <p className="text-[11px] text-muted-foreground/70">
        Se quiser, peça pro agente dividir esse disparo entre mais números conectados antes de continuar.
      </p>

      <button
        onClick={handleConfirm}
        disabled={disabled || confirmed}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <ShieldCheck className="size-4" />
        {confirmed ? "Confirmado" : "Continuar assim mesmo"}
      </button>
    </div>
  )
}
