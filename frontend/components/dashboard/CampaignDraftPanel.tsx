"use client"

import { useEffect, useState } from "react"
import { Rocket, Users, Wifi, MessageSquare, Paperclip, Clock, Zap, AlertTriangle, Loader2, X, CheckCircle2, Pencil, Plus, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type CampaignDraft = {
  name?: string
  contactListId?: string
  contactListName?: string
  leadCount?: number
  instanceId?: string
  instanceName?: string
  instanceStatus?: string
  messageVariations?: string[]
  mediaUrl?: string | null
  mediaType?: string
  scheduledAt?: string | null
  delaySeconds?: number
  sequentialMode?: boolean
  blockDelay?: number
  batchSize?: number
  batchDelaySeconds?: number
  timingConfirmed?: boolean
  readyToSend?: boolean
  quota?: { available: boolean; remaining: number; requested: number }
}

interface CampaignDraftPanelProps {
  draft: CampaignDraft
  onConfirm: () => void
  onRemoveMedia?: () => void
  onSaveMessages?: (variations: string[]) => void
  autoEditMessageTrigger?: number
  isConfirming?: boolean
}

function Field({ icon: Icon, label, filled, children }: { icon: any; label: string; filled: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className={cn("flex items-center justify-center size-8 rounded-lg shrink-0", filled ? "bg-purple-500/15 text-purple-500" : "bg-muted text-muted-foreground/50")}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
        <div className="text-sm text-foreground/90">{children}</div>
      </div>
    </div>
  )
}

function MessageCanvasEditor({
  initialVariations,
  onSave,
  onCancel,
}: {
  initialVariations: string[]
  onSave: (variations: string[]) => void
  onCancel: () => void
}) {
  const [variations, setVariations] = useState<string[]>(initialVariations.length > 0 ? initialVariations : [""])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const updateAt = (index: number, value: string) => {
    setVariations((prev) => prev.map((v, i) => (i === index ? value : v)))
  }

  const removeAt = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index))
  }

  const addVariation = () => setVariations((prev) => [...prev, ""])

  const handleCopy = (index: number) => {
    navigator.clipboard.writeText(variations[index]).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex((i) => (i === index ? null : i)), 1500)
    })
  }

  const validVariations = variations.map((v) => v.trim()).filter(Boolean)

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-muted-foreground/70">Cada envio escolhe uma variação aleatória — ajuda a fugir de bloqueio por spam.</p>

      {variations.map((v, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-start gap-2">
            <textarea
              autoFocus={i === 0}
              value={v}
              onChange={(e) => updateAt(i, e.target.value)}
              placeholder={`Variação ${i + 1}`}
              rows={3}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
            />
            <div className="flex flex-col gap-1 mt-0.5">
              <button onClick={() => handleCopy(i)} title="Copiar" className="text-muted-foreground/50 hover:text-purple-500 transition-colors">
                {copiedIndex === i ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              </button>
              {variations.length > 1 && (
                <button onClick={() => removeAt(i)} title="Remover" className="text-muted-foreground/50 hover:text-rose-500 transition-colors">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addVariation}
        className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-600"
      >
        <Plus className="size-3.5" /> Adicionar variação
      </button>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(validVariations)}
          disabled={validVariations.length === 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Check className="size-3.5" /> Salvar
        </button>
      </div>
    </div>
  )
}

export function CampaignDraftPanel({ draft, onConfirm, onRemoveMedia, onSaveMessages, autoEditMessageTrigger, isConfirming }: CampaignDraftPanelProps) {
  const [isEditingMessage, setIsEditingMessage] = useState(false)
  const messageCount = draft.messageVariations?.length ?? 0
  const scheduleLabel = draft.scheduledAt
    ? new Date(draft.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "Imediato"

  // O agente pediu explicitamente pra abrir o editor (tool request_message_variations_editor)
  // — abre aqui no painel em vez de um card solto na bolha do chat. O trigger é um contador
  // (não um boolean) pra disparar de novo mesmo se o agente pedir duas vezes seguidas.
  useEffect(() => {
    if (autoEditMessageTrigger) {
      setIsEditingMessage(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEditMessageTrigger])

  const handleSaveMessages = (variations: string[]) => {
    onSaveMessages?.(variations)
    setIsEditingMessage(false)
  }

  return (
    <div
      className={cn(
        "shrink-0 flex flex-col glass overflow-hidden z-50",
        // Mobile: bottom sheet
        "fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl",
        // Desktop (lg+): side column, back in normal flow
        "lg:static lg:w-[340px] lg:h-full lg:max-h-none lg:rounded-3xl"
      )}
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <span className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-500">
          <Rocket className="size-4.5" />
        </span>
        <div>
          <div className="text-sm font-medium text-foreground/90">Montando seu disparo</div>
          <div className="text-[11px] text-muted-foreground">O agente vai preenchendo conforme você fala</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <Field icon={Users} label="Lista de contatos" filled={!!draft.contactListId}>
          {draft.contactListName ? `${draft.contactListName} · ${draft.leadCount ?? 0} leads` : "Ainda não escolhida"}
        </Field>

        <Field icon={Wifi} label="WhatsApp" filled={!!draft.instanceId}>
          {draft.instanceName ? (
            <span className="flex items-center gap-1.5">
              {draft.instanceName}
              <span className={cn("size-1.5 rounded-full", draft.instanceStatus === "connected" ? "bg-emerald-400" : "bg-rose-400")} />
            </span>
          ) : (
            "Ainda não escolhido"
          )}
        </Field>

        <Field icon={MessageSquare} label="Mensagem" filled={messageCount > 0}>
          {isEditingMessage ? (
            <MessageCanvasEditor
              initialVariations={draft.messageVariations ?? []}
              onSave={handleSaveMessages}
              onCancel={() => setIsEditingMessage(false)}
            />
          ) : messageCount > 0 ? (
            <button onClick={() => setIsEditingMessage(true)} className="w-full text-left group/msg">
              <div className="space-y-1">
                <p className="line-clamp-2 text-foreground/80 group-hover/msg:text-foreground transition-colors">{draft.messageVariations![0]}</p>
                <div className="flex items-center gap-1.5">
                  {messageCount > 1 && <span className="text-[11px] text-purple-500">+{messageCount - 1} variação(ões)</span>}
                  <span className="text-[11px] text-muted-foreground/60 group-hover/msg:text-purple-500 flex items-center gap-1 transition-colors">
                    <Pencil className="size-3" /> editar
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <button onClick={() => setIsEditingMessage(true)} className="text-left text-muted-foreground hover:text-purple-500 transition-colors flex items-center gap-1.5">
              Ainda não definida <Pencil className="size-3" />
            </button>
          )}
        </Field>

        {draft.mediaUrl && (
          <Field icon={Paperclip} label="Mídia anexada" filled>
            <div className="flex items-start gap-2.5">
              {draft.mediaType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.mediaUrl}
                  alt="Prévia do anexo"
                  className="size-14 rounded-lg object-cover border border-border shrink-0"
                />
              ) : draft.mediaType === "video" ? (
                <video src={draft.mediaUrl} className="size-14 rounded-lg object-cover border border-border shrink-0" muted />
              ) : (
                <span className="flex items-center justify-center size-14 rounded-lg bg-muted text-muted-foreground shrink-0">
                  <Paperclip className="size-5" />
                </span>
              )}
              <span className="flex items-center gap-2 mt-1">
                {draft.mediaType || "arquivo"}
                {onRemoveMedia && (
                  <button onClick={onRemoveMedia} className="text-muted-foreground/50 hover:text-rose-500 transition-colors">
                    <X className="size-3.5" />
                  </button>
                )}
              </span>
            </div>
          </Field>
        )}

        <Field icon={Clock} label="Quando enviar" filled>
          {scheduleLabel}
        </Field>

        <Field icon={Zap} label="Timing do disparo" filled={!!draft.timingConfirmed}>
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] text-muted-foreground">
              {draft.sequentialMode ? "Modo sequencial ativado" : "Mensagem única"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] text-muted-foreground">
              {draft.delaySeconds ?? 5}s entre leads
            </span>
            {draft.timingConfirmed && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] text-muted-foreground">
                lotes de {draft.batchSize ?? 30}
              </span>
            )}
          </div>
          {draft.timingConfirmed ? (
            <p className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Confirmado por você
            </p>
          ) : (
            <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="size-3" /> Aguardando sua confirmação no chat
            </p>
          )}
        </Field>
      </div>

      {draft.quota && (
        <div
          className={cn(
            "mx-5 mb-3 px-3 py-2.5 rounded-xl text-xs flex items-start gap-2",
            draft.quota.available ? "bg-muted text-muted-foreground" : "bg-rose-500/10 text-rose-500"
          )}
        >
          {!draft.quota.available && <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />}
          {draft.quota.available
            ? "Você tem campanhas disponíveis este mês para disparar essa lista."
            : "Você já usou todas as suas campanhas deste mês. Considere fazer upgrade para disparos liberados."}
        </div>
      )}

      <div className="p-5 pt-2">
        <button
          onClick={onConfirm}
          disabled={!draft.readyToSend || isConfirming}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all",
            draft.readyToSend && !isConfirming
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-400"
              : "bg-muted text-muted-foreground/50 cursor-not-allowed"
          )}
        >
          {isConfirming ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
          {isConfirming ? "Disparando..." : "Confirmar e disparar"}
        </button>
      </div>
    </div>
  )
}
