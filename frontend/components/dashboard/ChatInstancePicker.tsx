"use client"

import { useEffect, useState } from "react"
import { Wifi, Loader2, Check } from "lucide-react"
import { api } from "@/services/api"
import { cn } from "@/lib/utils"

interface Instance {
  id: string
  name: string
  status: string
}

interface ChatInstancePickerProps {
  onConfirm: (values: { instanceIds: string[]; instanceNames: string[] }) => void
  disabled?: boolean
}

export function ChatInstancePicker({ onConfirm, disabled }: ChatInstancePickerProps) {
  const [instances, setInstances] = useState<Instance[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    api.instances
      .list()
      .then((data: any) => setInstances(Array.isArray(data) ? data : []))
      .catch(() => setInstances([]))
      .finally(() => setIsLoading(false))
  }, [])

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleConfirm = () => {
    const chosen = instances.filter((i) => selected.includes(i.id))
    if (chosen.length === 0) return
    setConfirmed(true)
    onConfirm({ instanceIds: chosen.map((i) => i.id), instanceNames: chosen.map((i) => i.name) })
  }

  return (
    <div className="mt-2 w-full max-w-[300px] rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="size-3.5 animate-spin" />
          Carregando seus WhatsApps...
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {instances.map((instance) => {
              const isSelected = selected.includes(instance.id)
              return (
                <button
                  key={instance.id}
                  onClick={() => toggle(instance.id)}
                  disabled={disabled || confirmed}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left disabled:opacity-50",
                    isSelected ? "bg-purple-500/15 border border-purple-500/40" : "bg-accent hover:bg-accent/70 border border-transparent"
                  )}
                >
                  <span className="flex items-center justify-center size-7 rounded-lg bg-purple-500/15 text-purple-500 shrink-0">
                    <Wifi className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm text-foreground truncate">
                      {instance.name}
                      <span className={cn("size-1.5 rounded-full", instance.status === "connected" ? "bg-emerald-400" : "bg-rose-400")} />
                    </span>
                  </span>
                  {isSelected && <Check className="size-4 text-purple-500 shrink-0" />}
                </button>
              )
            })}

            {instances.length === 0 && (
              <p className="text-xs text-muted-foreground px-1 py-1">Você ainda não tem nenhum WhatsApp conectado.</p>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={disabled || confirmed || selected.length === 0}
            className="w-full py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {confirmed ? "Confirmado" : selected.length > 1 ? `Usar ${selected.length} números` : "Usar esse WhatsApp"}
          </button>
        </>
      )}
    </div>
  )
}
