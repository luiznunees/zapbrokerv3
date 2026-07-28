"use client"

import { useState } from "react"
import { Plus, Search, Trash2, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ChatHistoryProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelect: (session: ChatSession) => void
  onNew: () => void
  onDelete: (sessionId: string) => void
  isNewChatAnimating?: boolean
}

export function ChatHistory({
  sessions,
  currentSessionId,
  onSelect,
  onNew,
  onDelete,
  isNewChatAnimating,
}: ChatHistoryProps) {
  const [search, setSearch] = useState("")

  const filtered = search
    ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions

  return (
    <div className="flex flex-col h-full rounded-2xl glass overflow-hidden">
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <button
          onClick={onNew}
          disabled={isNewChatAnimating}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-foreground/80 hover:bg-accent transition-all disabled:opacity-50"
        >
          <Plus className="size-4" />
          <span>Nova conversa</span>
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent border border-border text-sm text-muted-foreground">
          <Search className="size-4 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversas..."
            className="flex-1 bg-transparent outline-none text-foreground/80 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5 scrollbar-thin">
        {filtered.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">
            {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
          </div>
        )}
        {filtered.map((session) => (
          <div
            key={session.id}
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm",
              session.id === currentSessionId
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground/80"
            )}
            onClick={() => onSelect(session)}
          >
            <MessageSquare className="size-4 shrink-0" />
            <span className="flex-1 truncate">{session.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(session.id)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
