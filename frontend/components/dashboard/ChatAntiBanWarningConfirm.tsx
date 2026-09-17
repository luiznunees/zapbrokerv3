"use client"

import { useState } from "react"
import { AlertTriangle, ShieldCheck } from "lucide-react"

type WarmupDetail = {
  daysSinceConnected: number | null
  recommendedDailyLimit: number | null
  sentLast24h: number
}

type Reason = "volume" | "cooldown" | "warmup_limit"

interface ChatAntiBanWarningConfirmProps {
  purpose?: string
  onConfirm: () => void
  disabled?: boolean
}

type Parsed = {
  leadCount: number
  reasons: Reason[]
  warmup?: WarmupDetail
}

function parsePurpose(purpose?: string): Parsed {
  if (!purpose) return { leadCount: 0, reasons: ["volume"] }
  try {
    const data = JSON.parse(purpose)
    return {
      leadCount: Number(data.leadCount) || 0,
      // Compatível com o formato antigo (só leadCount, sem reasons) — assume "volume".
      reasons: Array.isArray(data.reasons) && data.reasons.length > 0 ? data.reasons : ["volume"],
      warmup: data.warmup,
    }
  } catch {
    return { leadCount: 0, reasons: ["volume"] }
  }
}

function reasonMessage(reason: Reason, leadCount: number, warmup?: WarmupDetail): string {
  switch (reason) {
    case "cooldown":
      return "Esse WhatsApp foi conectado há menos de 24h. Números muito novos têm o maior risco de bloqueio — o ideal é esperar completar 1 dia antes de disparar."
    case "warmup_limit": {
      const limit = warmup?.recommendedDailyLimit
      const days = warmup?.daysSinceConnected
      return `Esse WhatsApp tem ${days ?? "poucos"} dia(s) desde que conectou — o volume recomendado pra essa idade é até ${limit ?? "?"} mensagens/dia, e esse disparo passa disso.`
    }
    case "volume":
    default:
      return `Essa lista tem ${leadCount} leads e você escolheu só 1 número pra enviar. Disparar um volume grande por um único WhatsApp aumenta bastante a chance de bloqueio.`
  }
}

export function ChatAntiBanWarningConfirm({ purpose, onConfirm, disabled }: ChatAntiBanWarningConfirmProps) {
  const { leadCount, reasons, warmup } = parsePurpose(purpose)
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

      <ul className="space-y-2">
        {reasons.map((reason) => (
          <li key={reason} className="text-xs text-foreground/80 flex items-start gap-1.5">
            <span className="mt-1 size-1 rounded-full bg-amber-500 shrink-0" />
            {reasonMessage(reason, leadCount, warmup)}
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-muted-foreground/70">
        Se quiser, volte e divida esse disparo entre mais números conectados, ou reduza a lista antes de continuar.
      </p>

      <button
        onClick={handleConfirm}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <ShieldCheck className="size-4" />
        {confirmed ? "Confirmado" : "Continuar assim mesmo"}
      </button>
    </div>
  )
}
