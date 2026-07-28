"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Rocket, Send, CheckCircle2, XCircle, Clock, Pause, Play, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../../services/api'
import { Badge } from '@/components/ui/badge'

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  COMPLETED: { label: 'Concluído', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
  RUNNING: { label: 'Enviando', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  PENDING: { label: 'Pendente', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  PAUSED: { label: 'Pausado', class: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  FAILED: { label: 'Falhou', class: 'bg-red-500/10 text-red-600 border-red-500/20' },
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
            const status = STATUS_MAP[camp.status] || { label: camp.status, class: 'bg-muted text-muted-foreground' }
            return (
              <div
                key={camp.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
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
                    {(camp.status === 'PENDING' || camp.status === 'RUNNING' || camp.status === 'PAUSED') && (
                      <button
                        onClick={() => togglePause(camp.id, camp.status)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          camp.status === 'PAUSED'
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                        )}
                        title={camp.status === 'PAUSED' ? 'Retomar' : 'Pausar'}
                      >
                        {camp.status === 'PAUSED' ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                      </button>
                    )}
                    <Badge className={cn("border text-xs font-bold", status.class)}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
