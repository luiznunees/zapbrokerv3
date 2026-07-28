"use client"

import { User } from "lucide-react"

type LeadMatch = {
  id: string
  name: string
  phone: string
  status?: string
  lastInteractionAt?: string | null
}

interface ChatLeadPickerProps {
  purpose?: string
  onSelect: (lead: LeadMatch) => void
  disabled?: boolean
}

function parseMatches(purpose?: string): LeadMatch[] {
  if (!purpose) return []
  try {
    const parsed = JSON.parse(purpose)
    return Array.isArray(parsed.matches) ? parsed.matches : []
  } catch {
    return []
  }
}

export function ChatLeadPicker({ purpose, onSelect, disabled }: ChatLeadPickerProps) {
  const matches = parseMatches(purpose)

  return (
    <div className="mt-2 w-full max-w-[300px] rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-1.5">
      {matches.map((lead) => (
        <button
          key={lead.id}
          onClick={() => onSelect(lead)}
          disabled={disabled}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-accent hover:bg-accent/70 transition-colors text-left disabled:opacity-50"
        >
          <span className="flex items-center justify-center size-7 rounded-lg bg-purple-500/15 text-purple-500 shrink-0">
            <User className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-foreground truncate">{lead.name}</span>
            <span className="block text-[11px] text-muted-foreground">{lead.phone}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
