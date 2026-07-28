"use client"

import { useState } from "react"
import { Copy, Check, X } from "lucide-react"

interface ChatDuplicateCampaignConfirmProps {
  purpose?: string
  onConfirm: (values: { sourceName: string; pendingDraft: any }) => void
  onCancel?: () => void
  disabled?: boolean
}

function parsePayload(purpose?: string): { sourceName?: string; pendingDraft?: any } {
  if (!purpose) return {}
  try {
    return JSON.parse(purpose)
  } catch {
    return {}
  }
}

export function ChatDuplicateCampaignConfirm({ purpose, onConfirm, onCancel, disabled }: ChatDuplicateCampaignConfirmProps) {
  const { sourceName, pendingDraft } = parsePayload(purpose)
  const [resolved, setResolved] = useState(false)

  const handleConfirm = () => {
    setResolved(true)
    onConfirm({ sourceName: sourceName || "", pendingDraft })
  }

  const handleCancel = () => {
    setResolved(true)
    onCancel?.()
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-border glass p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Copy className="size-4 text-purple-500" />
        Reaproveitar "{sourceName}"?
      </div>

      <div className="space-y-1 text-xs text-foreground/80">
        <p>Vou copiar dessa campanha: mensagem, WhatsApp usado{pendingDraft?.mediaUrl ? ", mídia" : ""} e o timing.</p>
        <p className="text-muted-foreground/70">Você escolhe uma lista de contatos nova depois — nada é enviado ainda.</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleConfirm}
          disabled={disabled || resolved}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Check className="size-4" /> Usar como base
        </button>
        <button
          onClick={handleCancel}
          disabled={disabled || resolved}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
        >
          <X className="size-4" /> Cancelar
        </button>
      </div>
    </div>
  )
}
