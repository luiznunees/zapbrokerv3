"use client"

import { useState } from "react"
import { UserX, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Contact = { id: string; name: string; phone: string }

interface ChatContactExclusionPickerProps {
  purpose?: string
  onConfirm: (values: { excludedContactIds: string[] }) => void
  disabled?: boolean
}

function parsePayload(purpose?: string): { contacts: Contact[]; excludedContactIds: string[] } {
  if (!purpose) return { contacts: [], excludedContactIds: [] }
  try {
    const parsed = JSON.parse(purpose)
    return {
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      excludedContactIds: Array.isArray(parsed.excludedContactIds) ? parsed.excludedContactIds : [],
    }
  } catch {
    return { contacts: [], excludedContactIds: [] }
  }
}

export function ChatContactExclusionPicker({ purpose, onConfirm, disabled }: ChatContactExclusionPickerProps) {
  const { contacts, excludedContactIds: initialExcluded } = parsePayload(purpose)
  const [excluded, setExcluded] = useState<string[]>(initialExcluded)
  const [confirmed, setConfirmed] = useState(false)

  const toggle = (id: string) => {
    setExcluded((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm({ excludedContactIds: excluded })
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-border glass p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <UserX className="size-4 text-purple-500" />
        Excluir leads desse disparo
      </div>
      <p className="text-[11px] text-muted-foreground/70 -mt-2">Marque quem você NÃO quer que receba essa mensagem.</p>

      <div className="max-h-64 overflow-y-auto space-y-1">
        {contacts.map((contact) => {
          const isExcluded = excluded.includes(contact.id)
          return (
            <button
              key={contact.id}
              onClick={() => toggle(contact.id)}
              disabled={disabled || confirmed}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors disabled:opacity-50",
                isExcluded ? "bg-rose-500/10 border border-rose-500/30" : "bg-accent hover:bg-accent/70 border border-transparent"
              )}
            >
              <span className="min-w-0">
                <span className={cn("block text-sm truncate", isExcluded ? "text-rose-500 line-through" : "text-foreground")}>{contact.name}</span>
                <span className="block text-[11px] text-muted-foreground">{contact.phone}</span>
              </span>
            </button>
          )
        })}

        {contacts.length === 0 && <p className="text-xs text-muted-foreground px-1 py-1">Nenhum contato encontrado nessa lista.</p>}
      </div>

      <button
        onClick={handleConfirm}
        disabled={disabled || confirmed}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <Check className="size-4" />
        {confirmed ? "Salvo" : excluded.length > 0 ? `Excluir ${excluded.length} lead(s)` : "Não excluir ninguém"}
      </button>
    </div>
  )
}
