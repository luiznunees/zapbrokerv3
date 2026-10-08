"use client"

import { useState } from "react"
import { Clock, CalendarDays, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type SendWindow,
  DEFAULT_SEND_WINDOW,
  computeWindowDelaySeconds,
  formatInterval,
  formatMinute,
  minuteToTime,
  parseSendWindow,
  timeToMinute,
} from "@/lib/sendWindow"

export type TimingValues = {
  delaySeconds: number
  sequentialMode: boolean
  blockDelay: number
  // Lote nunca foi aplicado no envio — mantido só porque a API ainda exige os campos.
  batchSize: number
  batchDelaySeconds: number
  sendWindow: SendWindow
}

interface ChatTimingConfirmProps {
  purpose?: string
  onConfirm: (values: TimingValues) => void
  disabled?: boolean
}

type Defaults = {
  delaySeconds: number
  sequentialMode: boolean
  blockDelay: number
  sendWindow: SendWindow
  leadCount: number | null
}

const FALLBACK_DEFAULTS: Defaults = {
  delaySeconds: 60,
  sequentialMode: false,
  blockDelay: 5,
  sendWindow: DEFAULT_SEND_WINDOW,
  leadCount: null,
}

function parseDefaults(purpose?: string): Defaults {
  if (!purpose) return FALLBACK_DEFAULTS
  try {
    const parsed = JSON.parse(purpose)
    const leadCount = Number(parsed.leadCount) || null
    const sendWindow = parseSendWindow(parsed.sendWindow) ?? {
      ...DEFAULT_SEND_WINDOW,
      maxPerDay: leadCount ? Math.min(DEFAULT_SEND_WINDOW.maxPerDay ?? 100, leadCount) : DEFAULT_SEND_WINDOW.maxPerDay,
    }
    return {
      delaySeconds: Number(parsed.delaySeconds) || FALLBACK_DEFAULTS.delaySeconds,
      sequentialMode: Boolean(parsed.sequentialMode),
      blockDelay: Number(parsed.blockDelay) || FALLBACK_DEFAULTS.blockDelay,
      sendWindow,
      leadCount,
    }
  } catch {
    return FALLBACK_DEFAULTS
  }
}

const WEEKDAYS = [
  { day: 1, label: "S", name: "segunda" },
  { day: 2, label: "T", name: "terça" },
  { day: 3, label: "Q", name: "quarta" },
  { day: 4, label: "Q", name: "quinta" },
  { day: 5, label: "S", name: "sexta" },
  { day: 6, label: "S", name: "sábado" },
  { day: 0, label: "D", name: "domingo" },
]

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
          className="w-20 px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
      <p className="text-[11px] text-muted-foreground/70">{hint}</p>
    </div>
  )
}

function TimeField({ label, value, onChange }: { label: string; value: number; onChange: (minute: number) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      <input
        type="time"
        step={900}
        value={minuteToTime(value)}
        onChange={(e) => e.target.value && onChange(timeToMinute(e.target.value))}
        className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  )
}

export function ChatTimingConfirm({ purpose, onConfirm, disabled }: ChatTimingConfirmProps) {
  const defaults = parseDefaults(purpose)
  const [startMinute, setStartMinute] = useState(defaults.sendWindow.startMinute)
  const [endMinute, setEndMinute] = useState(defaults.sendWindow.endMinute)
  const [weekdays, setWeekdays] = useState<number[]>(defaults.sendWindow.weekdays)
  const [maxPerDay, setMaxPerDay] = useState(defaults.sendWindow.maxPerDay ?? 100)
  const [sequentialMode, setSequentialMode] = useState(defaults.sequentialMode)
  const [blockDelay, setBlockDelay] = useState(defaults.blockDelay)
  const [confirmed, setConfirmed] = useState(false)

  const sendWindow: SendWindow = { startMinute, endMinute, weekdays, maxPerDay }
  const windowError =
    endMinute <= startMinute ? "O fim precisa ser depois do início."
    : endMinute - startMinute < 60 ? "O horário precisa ter pelo menos 1 hora."
    : weekdays.length === 0 ? "Escolha pelo menos um dia."
    : null
  const delaySeconds = computeWindowDelaySeconds(sendWindow) ?? defaults.delaySeconds
  const days = defaults.leadCount ? Math.ceil(defaults.leadCount / maxPerDay) : null
  const hitFloor = delaySeconds === 60 && maxPerDay > 0

  const toggleDay = (day: number) =>
    setWeekdays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]))

  const handleConfirm = () => {
    if (windowError) return
    setConfirmed(true)
    onConfirm({ delaySeconds, sequentialMode, blockDelay, batchSize: 30, batchDelaySeconds: 60, sendWindow })
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-2xl border border-border glass p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Clock className="size-4 text-primary" />
        Confirme o horário do disparo
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TimeField label="Começa às" value={startMinute} onChange={setStartMinute} />
        <TimeField label="Para às" value={endMinute} onChange={setEndMinute} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
          <CalendarDays className="size-3.5 text-primary" />
          Dias de envio
        </div>
        <div className="flex gap-1.5">
          {WEEKDAYS.map(({ day, label, name }) => (
            <button
              key={day}
              type="button"
              aria-label={name}
              aria-pressed={weekdays.includes(day)}
              onClick={() => toggleDay(day)}
              className={cn(
                "size-8 rounded-lg text-xs font-medium border transition-colors",
                weekdays.includes(day)
                  ? "bg-primary text-white border-primary"
                  : "bg-background/60 text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <NumberField
        label="Mensagens por dia"
        hint={`Recomendamos ${defaults.sendWindow.maxPerDay ?? 100} pra esse número. Menos por dia = menos risco de bloqueio.`}
        value={maxPerDay}
        onChange={setMaxPerDay}
        min={1}
        suffix="por dia"
      />

      <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2.5 text-xs text-foreground/80 space-y-0.5">
        {windowError ? (
          <p className="text-destructive">{windowError}</p>
        ) : (
          <>
            <p>
              1 mensagem a cada <span className="font-medium text-foreground">~{formatInterval(delaySeconds)}</span>,
              das {formatMinute(startMinute)} às {formatMinute(endMinute)}.
            </p>
            {days !== null && (
              <p>
                A lista de {defaults.leadCount} contatos sai em{" "}
                <span className="font-medium text-foreground">{days === 1 ? "1 dia" : `${days} dias de envio`}</span>.
              </p>
            )}
            {hitFloor && <p className="text-muted-foreground">Intervalo mínimo é 1 min — nesse horário não cabem tantas.</p>}
            <p className="text-muted-foreground">Fora desse horário nada é enviado.</p>
          </>
        )}
      </div>

      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-xs font-medium text-foreground/80">Enviar em blocos (modo sequencial)</p>
          <p className="text-[11px] text-muted-foreground/70">Quebra mensagens longas em partes menores.</p>
        </div>
        <button
          onClick={() => setSequentialMode(!sequentialMode)}
          className={cn(
            "relative w-10 h-5.5 rounded-full transition-colors shrink-0",
            sequentialMode ? "bg-primary" : "bg-zinc-300"
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

      <button
        onClick={handleConfirm}
        disabled={disabled || confirmed || !!windowError}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-landing-sky-deep text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <CheckCircle2 className="size-4" />
        {confirmed ? "Configuração salva" : "Usar esse horário"}
      </button>
    </div>
  )
}
