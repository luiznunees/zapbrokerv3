"use client"

import { useState } from "react"
import { Clock, Send, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSchedulePickerProps {
  purpose?: string
  onConfirm: (values: { scheduledAt: string | null }) => void
  disabled?: boolean
}

function parseDefault(purpose?: string): string | null {
  if (!purpose) return null
  try {
    return JSON.parse(purpose).scheduledAt ?? null
  } catch {
    return null
  }
}

export function ChatSchedulePicker({ purpose, onConfirm, disabled }: ChatSchedulePickerProps) {
  const defaultValue = parseDefault(purpose)
  const [mode, setMode] = useState<"now" | "later">(defaultValue ? "later" : "now")
  const [datetime, setDatetime] = useState(defaultValue ? defaultValue.slice(0, 16) : "")
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm({ scheduledAt: mode === "later" && datetime ? new Date(datetime).toISOString() : null })
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-border glass p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Clock className="size-4 text-purple-500" />
        Quando enviar o disparo?
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode("now")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border transition-colors",
            mode === "now" ? "bg-purple-500 text-white border-purple-500" : "border-border text-muted-foreground hover:bg-accent"
          )}
        >
          <Send className="size-3.5" /> Agora
        </button>
        <button
          onClick={() => setMode("later")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border transition-colors",
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
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />
      )}

      <button
        onClick={handleConfirm}
        disabled={disabled || confirmed || (mode === "later" && !datetime)}
        className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {confirmed ? "Confirmado" : mode === "now" ? "Enviar agora" : "Confirmar agendamento"}
      </button>
    </div>
  )
}
