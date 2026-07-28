"use client"

import { useEffect, useState } from "react"
import { Users, Upload, Loader2 } from "lucide-react"
import { api } from "@/services/api"
import { LeadImporterModal, type ImportedList } from "@/components/dashboard/LeadImporterModal"

interface ContactList {
  id: string
  name: string
  leadCount: number
}

interface ChatListPickerProps {
  onSelect: (list: { id: string; name: string; leadCount: number }) => void
  disabled?: boolean
}

export function ChatListPicker({ onSelect, disabled }: ChatListPickerProps) {
  const [lists, setLists] = useState<ContactList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImporterOpen, setIsImporterOpen] = useState(false)

  useEffect(() => {
    api.contacts
      .listWithCounts()
      .then((data: any) => setLists(Array.isArray(data) ? data : []))
      .catch(() => setLists([]))
      .finally(() => setIsLoading(false))
  }, [])

  const handleImported = (list?: ImportedList) => {
    setIsImporterOpen(false)
    if (list) {
      onSelect({ id: list.id, name: list.name, leadCount: list.count })
    }
  }

  return (
    <div className="mt-2 w-full max-w-[300px] rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3">
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="size-3.5 animate-spin" />
          Carregando suas listas...
        </div>
      ) : (
        <div className="space-y-1.5">
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => onSelect(list)}
              disabled={disabled}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-accent hover:bg-accent/70 transition-colors text-left disabled:opacity-50"
            >
              <span className="flex items-center justify-center size-7 rounded-lg bg-purple-500/15 text-purple-500 shrink-0">
                <Users className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-foreground truncate">{list.name}</span>
                <span className="block text-[11px] text-muted-foreground">{list.leadCount} leads</span>
              </span>
            </button>
          ))}

          {lists.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-1">Você ainda não tem nenhuma lista.</p>
          )}

          <button
            onClick={() => setIsImporterOpen(true)}
            disabled={disabled}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-dashed border-border hover:border-purple-500/40 hover:bg-purple-500/5 transition-colors text-left disabled:opacity-50"
          >
            <span className="flex items-center justify-center size-7 rounded-lg bg-accent text-muted-foreground shrink-0">
              <Upload className="size-3.5" />
            </span>
            <span className="text-sm text-foreground">Importar nova lista</span>
          </button>
        </div>
      )}

      <LeadImporterModal isOpen={isImporterOpen} onClose={() => setIsImporterOpen(false)} onSuccess={handleImported} />
    </div>
  )
}
