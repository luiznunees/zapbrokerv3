"use client"

import { useState } from "react"
import { Rocket, Users, Wifi, MessageSquare, Clock, Loader2 } from "lucide-react"

type DraftSummary = {
  contactListName?: string
  leadCount?: number
  instanceName?: string
  instanceNames?: string[]
  messageVariations?: string[]
  scheduledAt?: string | null
  delaySeconds?: number
  batchSize?: number
}

interface ChatCampaignSummaryConfirmProps {
  purpose?: string
  onConfirm: () => void
  disabled?: boolean
  isConfirming?: boolean
}

function parseDraft(purpose?: string): DraftSummary {
  if (!purpose) return {}
  try {
    return JSON.parse(purpose)
  } catch {
    return {}
  }
}

function Row({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-foreground/90">
      <Icon className="size-4 text-purple-500 shrink-0" />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

export function ChatCampaignSummaryConfirm({ purpose, onConfirm, disabled, isConfirming }: ChatCampaignSummaryConfirmProps) {
  const draft = parseDraft(purpose)
  const [confirmed, setConfirmed] = useState(false)
  const scheduleLabel = draft.scheduledAt
    ? new Date(draft.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "Imediato"
  const instanceLabel = draft.instanceNames?.length ? draft.instanceNames.join(" + ") : draft.instanceName

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm()
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Rocket className="size-4 text-purple-500" />
        Tudo pronto pra disparar
      </div>

      <div className="space-y-2">
        <Row icon={Users}>{draft.contactListName} · {draft.leadCount ?? 0} leads</Row>
        <Row icon={Wifi}>{instanceLabel}</Row>
        <Row icon={MessageSquare}>
          {draft.messageVariations?.[0]?.slice(0, 50)}
          {(draft.messageVariations?.length ?? 0) > 1 ? ` (+${(draft.messageVariations!.length - 1)} variações)` : ""}
        </Row>
        <Row icon={Clock}>{scheduleLabel} · {draft.delaySeconds ?? 5}s entre mensagens · lotes de {draft.batchSize ?? 30}</Row>
      </div>

      <button
        onClick={handleConfirm}
        disabled={disabled || confirmed || isConfirming}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50"
      >
        {isConfirming ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
        {isConfirming ? "Disparando..." : "Disparar agora"}
      </button>
    </div>
  )
}
