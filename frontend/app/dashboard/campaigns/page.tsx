"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Rocket, Send, CheckCircle2, XCircle, Clock, Pause, Play, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../../services/api'
import { Badge } from '@/components/ui/badge'

type MessageCounts = { total: number; sent: number; failed: number; pending: number }

type EffectiveStatus = {
  label: string
  class: string
  icon: typeof Rocket
}

// O campo `campaigns.status` só assume PENDING/PAUSED/CANCELLED — nunca indica
// que o envio terminou. Quem decide "concluído/enviando/falhou" é a contagem
// de mensagens (messageCounts, vindo do backend), cruzada com esse status bruto.
function getEffectiveStatus(campaign: { status: string; scheduled_at?: string | null; messageCounts?: MessageCounts }): EffectiveStatus {
  const counts = campaign.messageCounts ?? { total: 0, sent: 0, failed: 0, pending: 0 }

  if (campaign.status === 'CANCELLED') {
    return { label: 'Cancelado', class: 'bg-muted text-muted-foreground border-border', icon: XCircle }
  }
  if (campaign.status === 'PAUSED') {
    return { label: 'Pausado', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Pause }
  }
  if (counts.total === 0) {
    return { label: 'Sem contatos', class: 'bg-muted text-muted-foreground border-border', icon: AlertTriangle }
  }
  if (counts.pending === counts.total) {
    const isScheduled = campaign.scheduled_at && new Date(campaign.scheduled_at) > new Date()
    return isScheduled
      ? { label: 'Agendado', class: 'bg-primary/10 text-primary border-primary/20', icon: Clock }
      : { label: 'Na fila', class: 'bg-muted text-muted-foreground border-border', icon: Clock }
  }
  if (counts.pending > 0) {
    return { label: 'Enviando', class: 'bg-primary/10 text-primary border-primary/20', icon: Loader2 }
  }
  if (counts.failed > 0) {
    return { label: 'Concluído com falhas', class: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle }
  }
  return { label: 'Concluído', class: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 }
}

export default function CampaignHistoryPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCampaigns() }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const data = await api.campaigns.list()
      setCampaigns(Array.isArray(data) ? data : (data.data || []))
    } catch (err) {
      console.error('Erro ao carregar disparos', err)
    } finally {
      setLoading(false)
    }
  }

  const togglePause = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'PAUSED') {
        await api.campaigns.resume(id)
      } else {
        await api.campaigns.pause(id)
      }
      fetchCampaigns()
    } catch (err) {
      console.error('Erro ao pausar/retomar', err)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Rocket className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Meus Disparos</h1>
          <p className="text-muted-foreground text-sm">Histórico de mensagens enviadas</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-accent/20">
          <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Nenhum disparo ainda</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Vá até o painel e peça pro agente criar seu primeiro disparo.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            <Rocket className="w-4 h-4" /> Ir pro Painel
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp) => {
            const status = getEffectiveStatus(camp)
            const counts: MessageCounts = camp.messageCounts ?? { total: 0, sent: 0, failed: 0, pending: 0 }
            const canPause = camp.status === 'PENDING' && counts.pending > 0
            const canResume = camp.status === 'PAUSED'
            const progressPct = counts.total > 0 ? Math.round(((counts.sent + counts.failed) / counts.total) * 100) : 0

            return (
              <div
                key={camp.id}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/campaigns/${camp.id}`}
                      className="font-bold text-foreground hover:text-primary transition-colors"
                    >
                      {camp.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(camp.created_at).toLocaleDateString('pt-BR')}
                      {camp.scheduled_at && ` · Agendado: ${new Date(camp.scheduled_at).toLocaleString('pt-BR')}`}
                    </p>
                    {camp.message && (
                      <p className="text-sm text-muted-foreground mt-2 truncate max-w-md">
                        {camp.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(canPause || canResume) && (
                      <button
                        onClick={() => togglePause(camp.id, camp.status)}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title={canResume ? 'Retomar' : 'Pausar'}
                      >
                        {canResume ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                      </button>
                    )}
                    <Badge className={cn("border text-xs font-bold flex items-center gap-1.5", status.class)}>
                      <status.icon className={cn("size-3", status.label === 'Enviando' && 'animate-spin')} />
                      {status.label}
                    </Badge>
                  </div>
                </div>

                {counts.total > 0 && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-500", counts.failed > 0 && counts.pending === 0 ? "bg-destructive" : "bg-primary")}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {counts.sent + counts.failed}/{counts.total}
                      {counts.failed > 0 && ` · ${counts.failed} falha${counts.failed === 1 ? '' : 's'}`}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
