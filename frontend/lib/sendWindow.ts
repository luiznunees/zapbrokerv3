// Espelho no front da conta de backend/src/utils/sendWindow.ts — só pra mostrar a previsão no
// seletor. Quem decide o intervalo de verdade é o backend (createCampaign), com a mesma conta.

export type SendWindow = {
  startMinute: number
  endMinute: number
  weekdays: number[] // 0 = domingo ... 6 = sábado
  maxPerDay: number | null
}

export const DEFAULT_SEND_WINDOW: SendWindow = {
  startMinute: 8 * 60,
  endMinute: 17 * 60,
  weekdays: [1, 2, 3, 4, 5, 6],
  maxPerDay: 100,
}

const MIN_WINDOW_DELAY_SECONDS = 60
const AVG_SEND_OVERHEAD_SECONDS = 10
const WINDOW_USAGE = 0.9

export function computeWindowDelaySeconds(w: SendWindow): number | null {
  if (!w.maxPerDay || w.endMinute <= w.startMinute) return null
  const perMessage = ((w.endMinute - w.startMinute) * 60 * WINDOW_USAGE) / w.maxPerDay - AVG_SEND_OVERHEAD_SECONDS
  return Math.max(MIN_WINDOW_DELAY_SECONDS, Math.floor(perMessage))
}

export function minuteToTime(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`
}

export function timeToMinute(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`
}

export function formatInterval(seconds: number): string {
  if (seconds < 90) return `${seconds}s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return sec >= 30 ? `${min}min${String(sec).padStart(2, "0")}s` : `${min} min`
}

const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]

export function describeWeekdays(weekdays: number[]): string {
  const key = [...weekdays].sort().join(",")
  if (key === "1,2,3,4,5,6") return "seg a sáb"
  if (key === "1,2,3,4,5") return "seg a sex"
  if (weekdays.length === 7) return "todo dia"
  return [...weekdays].sort().map((d) => WEEKDAY_SHORT[d]).join(", ")
}

// Ex: "8h às 17h · seg a sáb · até 100/dia"
export function describeSendWindow(w: SendWindow): string {
  const cap = w.maxPerDay ? ` · até ${w.maxPerDay}/dia` : ""
  return `${formatMinute(w.startMinute)} às ${formatMinute(w.endMinute)} · ${describeWeekdays(w.weekdays)}${cap}`
}

export function parseSendWindow(value: any): SendWindow | null {
  if (!value || typeof value !== "object") return null
  return {
    startMinute: Number(value.startMinute ?? DEFAULT_SEND_WINDOW.startMinute),
    endMinute: Number(value.endMinute ?? DEFAULT_SEND_WINDOW.endMinute),
    weekdays: Array.isArray(value.weekdays) ? value.weekdays.map(Number) : DEFAULT_SEND_WINDOW.weekdays,
    maxPerDay: value.maxPerDay === null ? null : Number(value.maxPerDay ?? DEFAULT_SEND_WINDOW.maxPerDay),
  }
}
