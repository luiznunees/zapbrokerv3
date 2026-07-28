"use client"

import { useState } from "react"
import { MessageSquare, Plus, X, Check } from "lucide-react"

interface ChatMessageVariationsEditorProps {
  purpose?: string
  onConfirm: (values: { messageVariations: string[] }) => void
  disabled?: boolean
}

function parseDefault(purpose?: string): string[] {
  if (!purpose) return [""]
  try {
    const parsed = JSON.parse(purpose)
    const variations = Array.isArray(parsed.messageVariations) ? parsed.messageVariations : []
    return variations.length > 0 ? variations : [""]
  } catch {
    return [""]
  }
}

export function ChatMessageVariationsEditor({ purpose, onConfirm, disabled }: ChatMessageVariationsEditorProps) {
  const [variations, setVariations] = useState<string[]>(parseDefault(purpose))
  const [confirmed, setConfirmed] = useState(false)

  const updateAt = (index: number, value: string) => {
    setVariations((prev) => prev.map((v, i) => (i === index ? value : v)))
  }

  const removeAt = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index))
  }

  const addVariation = () => setVariations((prev) => [...prev, ""])

  const validVariations = variations.map((v) => v.trim()).filter(Boolean)

  const handleConfirm = () => {
    if (validVariations.length === 0) return
    setConfirmed(true)
    onConfirm({ messageVariations: validVariations })
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-border glass p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageSquare className="size-4 text-purple-500" />
        Variações da mensagem
      </div>
      <p className="text-[11px] text-muted-foreground/70 -mt-2">Cada envio escolhe uma variação aleatória — ajuda a fugir de bloqueio por spam.</p>

      <div className="space-y-2">
        {variations.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea
              value={v}
              onChange={(e) => updateAt(i, e.target.value)}
              placeholder={`Variação ${i + 1}`}
              rows={2}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
            />
            {variations.length > 1 && (
              <button onClick={() => removeAt(i)} className="mt-1.5 text-muted-foreground/50 hover:text-rose-500 transition-colors">
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addVariation}
        disabled={disabled || confirmed}
        className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-600 disabled:opacity-50"
      >
        <Plus className="size-3.5" /> Adicionar variação
      </button>

      <button
        onClick={handleConfirm}
        disabled={disabled || confirmed || validVariations.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <Check className="size-4" />
        {confirmed ? "Mensagens salvas" : "Salvar mensagens"}
      </button>
    </div>
  )
}
