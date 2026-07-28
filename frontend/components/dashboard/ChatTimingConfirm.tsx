"use client"

import { useState } from "react"
import { Clock, Layers, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type TimingValues = {
  delaySeconds: number
  sequentialMode: boolean
  blockDelay: number
  batchSize: number
  batchDelaySeconds: number
}

interface ChatTimingConfirmProps {
  purpose?: string
  onConfirm: (values: TimingValues) => void
  disabled?: boolean
}

const FALLBACK_DEFAULTS: TimingValues = {
  delaySeconds: 5,
  sequentialMode: false,
  blockDelay: 5,
  batchSize: 30,
  batchDelaySeconds: 60,
}

function parseDefaults(purpose?: string): TimingValues {
  if (!purpose) return FALLBACK_DEFAULTS
  try {
    const parsed = JSON.parse(purpose)
    return {
      delaySeconds: Number(parsed.delaySeconds) || FALLBACK_DEFAULTS.delaySeconds,
      sequentialMode: Boolean(parsed.sequentialMode),
      blockDelay: Number(parsed.blockDelay) || FALLBACK_DEFAULTS.blockDelay,
      batchSize: Number(parsed.batchSize) || FALLBACK_DEFAULTS.batchSize,
      batchDelaySeconds: Number(parsed.batchDelaySeconds) || FALLBACK_DEFAULTS.batchDelaySeconds,
    }
  } catch {
    return FALLBACK_DEFAULTS
  }
}

function NumberField({
  label, hint, value, onChange, min = 1, suffix,
}: { label: string; hint: string; value: number; onChange: (v: number) => void; min?: number; suffix: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
          className="w-20 px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
      <p className="text-[11px] text-muted-foreground/70">{hint}</p>
    </div>
  )
}

export function ChatTimingConfirm({ purpose, onConfirm, disabled }: ChatTimingConfirmProps) {
  const defaults = parseDefaults(purpose)
  const [delaySeconds, setDelaySeconds] = useState(defaults.delaySeconds)
  const [sequentialMode, setSequentialMode] = useState(defaults.sequentialMode)
  const [blockDelay, setBlockDelay] = useState(defaults.blockDelay)
  const [batchSize, setBatchSize] = useState(defaults.batchSize)
  const [batchDelaySeconds, setBatchDelaySeconds] = useState(defaults.batchDelaySeconds)
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm({ delaySeconds, sequentialMode, blockDelay, batchSize, batchDelaySeconds })
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-border glass p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Clock className="size-4 text-purple-500" />
        Confirme o timing do disparo
      </div>

      <NumberField
        label="Segundos entre mensagens"
        hint={`Recomendamos ${defaults.delaySeconds}s pra esse tamanho de lista, mas você decide.`}
        value={delaySeconds}
        onChange={setDelaySeconds}
        min={2}
        suffix="segundos"
      />

      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-xs font-medium text-foreground/80">Enviar em blocos (modo sequencial)</p>
          <p className="text-[11px] text-muted-foreground/70">Quebra mensagens longas em partes menores.</p>
        </div>
        <button
          onClick={() => setSequentialMode(!sequentialMode)}
          className={cn(
            "relative w-10 h-5.5 rounded-full transition-colors shrink-0",
            sequentialMode ? "bg-purple-500" : "bg-zinc-300"
          )}
        >
          <span className={cn(
            "absolute top-0.5 left-0.5 size-4.5 rounded-full bg-white transition-transform",
            sequentialMode && "translate-x-4.5"
          )} />
        </button>
      </div>

      {sequentialMode && (
        <NumberField
          label="Intervalo entre blocos"
          hint="Tempo de espera entre cada parte da mensagem."
          value={blockDelay}
          onChange={setBlockDelay}
          min={2}
          suffix="segundos"
        />
      )}

      <div className="h-px bg-border" />

      <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
        <Layers className="size-3.5 text-purple-500" />
        Envio em lotes
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Leads por lote"
          hint="Recomendamos 30."
          value={batchSize}
          onChange={setBatchSize}
          min={1}
          suffix="leads"
        />
        <NumberField
          label="Intervalo entre lotes"
          hint="Recomendamos 60s."
          value={batchDelaySeconds}
          onChange={setBatchDelaySeconds}
          min={5}
          suffix="segundos"
        />
      </div>

      <button
        onClick={handleConfirm}
        disabled={disabled || confirmed}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <CheckCircle2 className="size-4" />
        {confirmed ? "Configuração salva" : "Usar essa configuração"}
      </button>
    </div>
  )
}
