"use client"

import { useState } from "react"
import { AlertTriangle, ShieldCheck } from "lucide-react"

type WarmupDetail = {
  daysSinceConnected: number | null
  recommendedDailyLimit: number | null
  sentLast24h: number
  // "chip" = o usuário informou a idade real do chip no WhatsApp (o que de fato importa
  // pro risco). "connection" = não informou, e caímos no fallback (data de conexão no
  // ZapBroker) — que pode estar bem errado se o chip já era usado antes de conectar aqui.
  basis?: "chip" | "connection"
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
  const isChipBasis = warmup?.basis === "chip"

  switch (reason) {
    case "cooldown":
      return isChipBasis
        ? "Você indicou que esse chip tem menos de 1 dia de uso real no WhatsApp — números muito novos têm o maior risco de bloqueio. O ideal é esperar completar pelo menos 1 dia de aquecimento antes de disparar."
        : "Esse WhatsApp foi conectado ao ZapBroker há menos de 24h e a idade real do chip não foi informada — por segurança, tratamos como número novo. Se ele já tem uso real de WhatsApp há mais tempo, informe a idade do chip nas configurações da instância pra um aviso mais preciso."
    case "warmup_limit": {
      const limit = warmup?.recommendedDailyLimit
      const days = warmup?.daysSinceConnected
      return isChipBasis
        ? `Você indicou que esse chip tem ${days ?? "poucos"} dia(s) de uso no WhatsApp — o volume recomendado pra essa idade é até ${limit ?? "?"} mensagens/dia, e esse disparo passa disso.`
        : `Esse WhatsApp foi conectado ao ZapBroker há ${days ?? "poucos"} dia(s) (idade real do chip não informada) — o volume recomendado pra esse tempo é até ${limit ?? "?"} mensagens/dia, e esse disparo passa disso.`
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
