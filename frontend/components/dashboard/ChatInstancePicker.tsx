"use client"

import { useEffect, useState } from "react"
import { Wifi, Loader2, Check } from "lucide-react"
import { api } from "@/services/api"
import { cn } from "@/lib/utils"

interface Instance {
  id: string
  name: string
  status: string
  phone_number?: string | null
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
    <div className="mt-2 w-full max-w-[300px] rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-2">
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
              const isConnected = instance.status === "connected"
              return (
                <button
                  key={instance.id}
                  onClick={() => toggle(instance.id)}
                  disabled={disabled || confirmed || !isConnected}
                  title={isConnected ? undefined : "Desconectado — conecte esse WhatsApp antes de usar no disparo"}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed",
                    isSelected ? "bg-primary/15 border border-primary/40" : "bg-accent hover:bg-accent/70 border border-transparent"
                  )}
                >
                  <span className="flex items-center justify-center size-7 rounded-lg bg-primary/15 text-primary shrink-0">
                    <Wifi className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sm text-foreground truncate block">{instance.name}</span>
                    {instance.phone_number && (
                      <span className="text-[11px] text-muted-foreground truncate block">{instance.phone_number}</span>
                    )}
                  </span>
                  <span className={cn(
                    "flex items-center gap-1 text-[11px] font-medium shrink-0",
                    isConnected ? "text-emerald-500" : "text-rose-500"
                  )}>
                    <span className={cn("size-1.5 rounded-full", isConnected ? "bg-emerald-400" : "bg-rose-400")} />
                    {isConnected ? "Conectado" : "Desconectado"}
                  </span>
                  {isSelected && <Check className="size-4 text-primary shrink-0" />}
                </button>
              )
            })}

            {instances.length === 0 && (
              <p className="text-xs text-muted-foreground px-1 py-1">Você ainda não tem nenhum WhatsApp conectado.</p>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground/80 px-1">
            Selecionar mais de um distribui o envio entre eles, reduzindo o volume por número.
          </p>

          <button
            onClick={handleConfirm}
            disabled={disabled || confirmed || selected.length === 0}
            className="w-full py-2 rounded-xl bg-primary hover:bg-landing-sky-deep text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {confirmed ? "Confirmado" : selected.length > 1 ? `Usar ${selected.length} números` : "Usar esse WhatsApp"}
          </button>
        </>
      )}
    </div>
  )
}
