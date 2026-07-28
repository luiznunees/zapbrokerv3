"use client"

import { useState } from "react"
import { Users, Send, CalendarClock, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type StalledLead = {
  contactId: string
  name: string
  phone: string
  leadStatus?: string
  updatedAt?: string
  campaignName?: string
}

interface ChatFollowUpSchedulerProps {
  purpose?: string
  onConfirm: (values: { contactIds: string[]; message: string; scheduledAt: string | null }) => void
  disabled?: boolean
}

function parseLeads(purpose?: string): StalledLead[] {
  if (!purpose) return []
  try {
    const parsed = JSON.parse(purpose)
    return Array.isArray(parsed.stalledLeads) ? parsed.stalledLeads : []
  } catch {
    return []
  }
}

export function ChatFollowUpScheduler({ purpose, onConfirm, disabled }: ChatFollowUpSchedulerProps) {
  const leads = parseLeads(purpose)
  const [selected, setSelected] = useState<string[]>(leads.map((l) => l.contactId))
  const [message, setMessage] = useState("")
  const [mode, setMode] = useState<"now" | "later">("now")
  const [datetime, setDatetime] = useState("")
  const [confirmed, setConfirmed] = useState(false)

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const canConfirm = selected.length > 0 && message.trim().length > 0 && (mode === "now" || !!datetime)

  const handleConfirm = () => {
    if (!canConfirm) return
    setConfirmed(true)
    onConfirm({
      contactIds: selected,
      message: message.trim(),
      scheduledAt: mode === "later" && datetime ? new Date(datetime).toISOString() : null,
    })
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-border glass p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Users className="size-4 text-purple-500" />
        Leads parados — follow-up
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1">
        {leads.map((lead) => {
          const isSelected = selected.includes(lead.contactId)
          return (
            <button
              key={lead.contactId}
              onClick={() => toggle(lead.contactId)}
              disabled={disabled || confirmed}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors disabled:opacity-50",
                isSelected ? "bg-purple-500/15 border border-purple-500/40" : "bg-accent hover:bg-accent/70 border border-transparent"
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm text-foreground truncate">{lead.name}</span>
                <span className="block text-[11px] text-muted-foreground truncate">{lead.campaignName || lead.phone}</span>
              </span>
              {isSelected && <Check className="size-4 text-purple-500 shrink-0" />}
            </button>
          )
        })}

        {leads.length === 0 && <p className="text-xs text-muted-foreground px-1 py-1">Nenhum lead parado no momento.</p>}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Mensagem de follow-up..."
        rows={3}
        disabled={disabled || confirmed}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode("now")}
          disabled={disabled || confirmed}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border transition-colors disabled:opacity-50",
            mode === "now" ? "bg-purple-500 text-white border-purple-500" : "border-border text-muted-foreground hover:bg-accent"
          )}
        >
          <Send className="size-3.5" /> Agora
        </button>
        <button
          onClick={() => setMode("later")}
          disabled={disabled || confirmed}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border transition-colors disabled:opacity-50",
            mode === "later" ? "bg-purple-500 text-white border-purple-500" : "border-border text-muted-foreground hover:bg-accent"
          )}
        >
          <CalendarClock className="size-3.5" /> Agendar
        </button>
      </div>

      {mode === "later" && (
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          disabled={disabled || confirmed}
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />
      )}

      <button
        onClick={handleConfirm}
        disabled={disabled || confirmed || !canConfirm}
        className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {confirmed ? "Follow-up criado" : `Enviar pra ${selected.length} lead(s)`}
      </button>
    </div>
  )
}
