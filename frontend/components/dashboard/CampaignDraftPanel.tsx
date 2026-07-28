"use client"

import { Rocket, Users, Wifi, MessageSquare, Paperclip, Clock, Zap, AlertTriangle, Loader2, X, CheckCircle2 } from "lucide-react"
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

export function CampaignDraftPanel({ draft, onConfirm, onRemoveMedia, isConfirming }: CampaignDraftPanelProps) {
  const messageCount = draft.messageVariations?.length ?? 0
  const scheduleLabel = draft.scheduledAt
    ? new Date(draft.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "Imediato"

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
          {messageCount > 0 ? (
            <div className="space-y-1">
              <p className="line-clamp-2 text-foreground/80">{draft.messageVariations![0]}</p>
              {messageCount > 1 && <span className="text-[11px] text-purple-500">+{messageCount - 1} variação(ões)</span>}
            </div>
          ) : (
            "Ainda não definida"
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
