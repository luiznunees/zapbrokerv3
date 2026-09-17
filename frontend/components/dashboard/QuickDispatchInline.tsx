"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { X, MessageSquare, Plus, Trash2, ChevronLeft, Zap, CheckCircle2, Loader2, XCircle, ExternalLink } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"
import { api } from "@/services/api"
import { ChatListPicker } from "@/components/dashboard/ChatListPicker"
import { ChatInstancePicker } from "@/components/dashboard/ChatInstancePicker"
import { ChatAntiBanWarningConfirm } from "@/components/dashboard/ChatAntiBanWarningConfirm"
import { ChatCampaignSummaryConfirm } from "@/components/dashboard/ChatCampaignSummaryConfirm"
import { ChatTimingConfirm, type TimingValues } from "@/components/dashboard/ChatTimingConfirm"

// Espelha as regras do agente (agentService.ts) pra manter o mesmo comportamento
// sem gastar chamada de IA: limiar de risco de bloqueio e timing padrão por tamanho de lista.
const ANTIBAN_LEAD_THRESHOLD = 300

function defaultDelaySeconds(leadCount: number) {
  if (leadCount > 200) return 90
  if (leadCount > 50) return 75
  return 60
}

type Step = "list" | "instance" | "message" | "antiban" | "timing" | "review" | "status"

type SelectedList = { id: string; name: string; leadCount: number }
type SelectedInstances = { instanceIds: string[]; instanceNames: string[] }
type QueueCounts = { total: number; sent: number; failed: number; pending: number }
type WarmupInfo = { daysSinceConnected: number | null; recommendedDailyLimit: number | null; sentLast24h: number; inCooldown: boolean }
type RiskReason = "volume" | "cooldown" | "warmup_limit"

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 60 // ~3min — depois disso para de bater no servidor à toa, mas o link do Kanban continua valendo

interface QuickDispatchInlineProps {
  onExit: () => void
}

const STEP_ORDER: Step[] = ["list", "instance", "message", "timing", "review"]

export function QuickDispatchInline({ onExit }: QuickDispatchInlineProps) {
  useReducedMotion()
  const [step, setStep] = useState<Step>("list")
  const [list, setList] = useState<SelectedList | null>(null)
  const [instances, setInstances] = useState<SelectedInstances | null>(null)
  const [messages, setMessages] = useState<string[]>([""])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [queueCounts, setQueueCounts] = useState<QueueCounts | null>(null)
  const [riskReasons, setRiskReasons] = useState<RiskReason[]>([])
  const [warmup, setWarmup] = useState<WarmupInfo | undefined>(undefined)
  const [timing, setTiming] = useState<TimingValues | null>(null)
  const pollCountRef = useRef(0)

  const handleSelectList = (selected: SelectedList) => {
    setList(selected)
    setStep("instance")
  }

  const handleConfirmInstances = async (selected: SelectedInstances) => {
    setInstances(selected)
    const leadCount = list?.leadCount ?? 0
    const usingSingleInstance = selected.instanceIds.length <= 1
    const reasons: RiskReason[] = []

    if (usingSingleInstance && leadCount > ANTIBAN_LEAD_THRESHOLD) {
      reasons.push("volume")
    }

    // Aquecimento só faz sentido checar com 1 número — com vários, o volume já
    // se divide entre eles (mesma regra que o aviso de risco por volume usa).
    if (usingSingleInstance) {
      try {
        const info: WarmupInfo = await api.instances.getWarmup(selected.instanceIds[0])
        setWarmup(info)
        if (info.inCooldown) {
          reasons.push("cooldown")
        } else if (info.recommendedDailyLimit !== null && info.sentLast24h + leadCount > info.recommendedDailyLimit) {
          reasons.push("warmup_limit")
        }
      } catch {
        // Se a checagem falhar, segue sem bloquear o fluxo — é aviso, não trava.
      }
    }

    setRiskReasons(reasons)
    setStep(reasons.length > 0 ? "antiban" : "message")
  }

  const handleAckAntiBan = () => setStep("message")

  const updateMessage = (i: number, value: string) => {
    setMessages((prev) => prev.map((m, idx) => (idx === i ? value : m)))
  }

  const addVariation = () => setMessages((prev) => [...prev, ""])
  const removeVariation = (i: number) => setMessages((prev) => prev.filter((_, idx) => idx !== i))

  const validMessages = messages.map((m) => m.trim()).filter(Boolean)

  const PREV_STEP: Record<Step, Step | null> = {
    list: null,
    instance: "list",
    antiban: "instance",
    message: "instance",
    timing: "message",
    review: "timing",
    status: null,
  }
  const goBack = () => {
    const prev = PREV_STEP[step]
    if (prev) setStep(prev)
  }

  const handleSubmit = async () => {
    if (!list || !instances || !timing || validMessages.length === 0) return
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      const today = new Date().toLocaleDateString("pt-BR")
      formData.append("name", `Disparo rápido - ${list.name} - ${today}`)
      formData.append("messageVariations", JSON.stringify(validMessages))
      formData.append("contactListId", list.id)
      formData.append("instanceIds", JSON.stringify(instances.instanceIds))
      formData.append("delaySeconds", String(timing.delaySeconds))
      formData.append("sequentialMode", String(timing.sequentialMode))
      formData.append("blockDelay", String(timing.blockDelay))
      formData.append("batchSize", String(timing.batchSize))
      formData.append("batchDelaySeconds", String(timing.batchDelaySeconds))
      formData.append("mediaType", "text")

      const created = await api.campaigns.create(formData)
      toast.success("Disparo criado! Já entrou na fila de envio.")
      pollCountRef.current = 0
      setCampaignId(created.id)
      setStep("status")
    } catch (error: any) {
      toast.error(error?.message || "Não consegui criar o disparo. Tenta de novo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (step !== "status" || !campaignId) return

    let cancelled = false

    const poll = async (): Promise<number | null> => {
      try {
        const details = await api.campaigns.getDetails(campaignId)
        const msgs: Array<{ status: string }> = details?.messages || []
        const total = msgs.length
        const sent = msgs.filter((m) => m.status === "SENT").length
        const failed = msgs.filter((m) => m.status === "FAILED").length
        const pending = total - sent - failed
        if (!cancelled) setQueueCounts({ total, sent, failed, pending })
        return pending
      } catch {
        return null // erro de rede não deve parar o polling sozinho
      }
    }

    poll()
    const interval = setInterval(async () => {
      pollCountRef.current += 1
      const pending = await poll()
      if (pending === 0 || pollCountRef.current >= MAX_POLLS) {
        clearInterval(interval)
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [step, campaignId])

  const stepIndex = STEP_ORDER.indexOf(step === "antiban" ? "instance" : step)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="relative rounded-3xl glass shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          {step === "status" ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Zap className="size-3.5" /> Disparo enviado
            </span>
          ) : step !== "list" ? (
            <button
              onClick={goBack}
              disabled={isSubmitting}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <ChevronLeft className="size-3.5" /> Voltar
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Zap className="size-3.5" /> Disparo rápido
            </span>
          )}
        </div>
        <button onClick={onExit} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground disabled:opacity-50" aria-label="Voltar pro chat">
          <X className="size-4" />
        </button>
      </div>

      {step !== "status" && (
        <div className="flex items-center gap-1.5 px-4 pt-3">
          {STEP_ORDER.map((s, i) => (
            <span key={s} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      )}

      <div className="p-4 h-[400px] overflow-y-auto">
        {step === "list" && (
          <div>
            <p className="text-sm text-foreground/90 mb-1">Pra qual lista você quer disparar?</p>
            <ChatListPicker onSelect={handleSelectList} />
          </div>
        )}

        {step === "instance" && (
          <div>
            <p className="text-sm text-foreground/90 mb-1">De qual WhatsApp vai sair?</p>
            <ChatInstancePicker onConfirm={handleConfirmInstances} />
          </div>
        )}

        {step === "antiban" && (
          <ChatAntiBanWarningConfirm
            purpose={JSON.stringify({ leadCount: list?.leadCount ?? 0, reasons: riskReasons, warmup })}
            onConfirm={handleAckAntiBan}
          />
        )}

        {step === "message" && (
          <div className="space-y-3">
            <p className="text-sm text-foreground/90">Qual mensagem vai enviar?</p>
            {messages.map((m, i) => (
              <div key={i} className="relative">
                <textarea
                  value={m}
                  onChange={(e) => updateMessage(i, e.target.value)}
                  placeholder={i === 0 ? "Escreve a mensagem aqui..." : `Variação ${i + 1}...`}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                />
                {messages.length > 1 && (
                  <button
                    onClick={() => removeVariation(i)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    aria-label="Remover variação"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addVariation} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Plus className="size-3.5" /> Adicionar variação
            </button>
            <button
              onClick={() => setStep("timing")}
              disabled={validMessages.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <MessageSquare className="size-4" /> Continuar
            </button>
          </div>
        )}

        {step === "timing" && list && (
          <ChatTimingConfirm
            purpose={JSON.stringify({
              delaySeconds: defaultDelaySeconds(list.leadCount),
              batchSize: 30,
              batchDelaySeconds: 60,
            })}
            onConfirm={(values) => {
              setTiming(values)
              setStep("review")
            }}
          />
        )}

        {step === "review" && list && instances && timing && (
          <ChatCampaignSummaryConfirm
            purpose={JSON.stringify({
              contactListName: list.name,
              leadCount: list.leadCount,
              instanceNames: instances.instanceNames,
              messageVariations: validMessages,
              scheduledAt: null,
              delaySeconds: timing.delaySeconds,
              batchSize: timing.batchSize,
            })}
            onConfirm={handleSubmit}
            isConfirming={isSubmitting}
          />
        )}

        {step === "status" && campaignId && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {list?.name ?? "Disparo"}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {queueCounts ? `${queueCounts.total} contato${queueCounts.total === 1 ? "" : "s"} na fila` : "Carregando fila..."}
                </p>
              </div>
            </div>

            {queueCounts && (
              <>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${queueCounts.total > 0 ? ((queueCounts.sent + queueCounts.failed) / queueCounts.total) * 100 : 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-background border border-border py-2.5">
                    <p className="text-lg font-bold text-foreground leading-tight">{queueCounts.sent}</p>
                    <p className="text-[11px] text-muted-foreground">enviados</p>
                  </div>
                  <div className="rounded-xl bg-background border border-border py-2.5">
                    <p className="text-lg font-bold text-foreground leading-tight flex items-center justify-center gap-1">
                      {queueCounts.pending > 0 && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                      {queueCounts.pending}
                    </p>
                    <p className="text-[11px] text-muted-foreground">na fila</p>
                  </div>
                  <div className="rounded-xl bg-background border border-border py-2.5">
                    <p className={`text-lg font-bold leading-tight ${queueCounts.failed > 0 ? "text-destructive" : "text-foreground"}`}>{queueCounts.failed}</p>
                    <p className="text-[11px] text-muted-foreground">falharam</p>
                  </div>
                </div>

                {queueCounts.pending === 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    {queueCounts.failed === 0 ? "Disparo concluído! 🎉" : "Disparo concluído, com algumas falhas."}
                  </p>
                )}
              </>
            )}

            <div className="flex gap-2">
              <Link
                href={`/dashboard/campaigns/${campaignId}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Ver detalhes <ExternalLink className="size-3.5" />
              </Link>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
