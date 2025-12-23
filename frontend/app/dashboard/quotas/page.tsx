"use client"
import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { Calendar, TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuotaHistory {
    week_start: string
    week_end: string
    plan_limit: number
    messages_used: number
    messages_remaining: number
}

export default function QuotaHistoryPage() {
    const [history, setHistory] = useState<QuotaHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            setLoading(true)
            const data = await api.quotas.history()
            setHistory(data.history || [])
            setError(null)
        } catch (err: any) {
            console.error('Error fetching quota history:', err)
            setError(err.message || 'Erro ao carregar histórico')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <RefreshCw className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Carregando histórico...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Erro ao Carregar</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <button
                    onClick={fetchHistory}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    Tentar Novamente
                </button>
            </div>
        )
    }

    const totalUsed = history.reduce((sum, h) => sum + h.messages_used, 0)
    const avgUsage = history.length > 0 ? Math.round(totalUsed / history.length) : 0

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Histórico de Quotas</h1>
                <p className="text-muted-foreground">Acompanhe seu uso semanal de mensagens ao longo do tempo</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Total de Semanas</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{history.length}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Total Enviado</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{totalUsed.toLocaleString()}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Calendar className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Média Semanal</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{avgUsage.toLocaleString()}</p>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Histórico por Semana
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-accent/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="px-6 py-4">Período</th>
                                <th className="px-6 py-4">Limite</th>
                                <th className="px-6 py-4">Usado</th>
                                <th className="px-6 py-4">Restante</th>
                                <th className="px-6 py-4">% Uso</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {history.length > 0 ? (
                                history.map((week, index) => {
                                    const percentage = (week.messages_used / week.plan_limit) * 100
                                    const isHigh = percentage > 80
                                    const isCritical = percentage > 95

                                    return (
                                        <tr key={index} className="hover:bg-accent/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">
                                                    {new Date(week.week_start).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'short'
                                                    })} - {new Date(week.week_end).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {week.plan_limit.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-foreground">
                                                    {week.messages_used.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {week.messages_remaining.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden max-w-[100px]">
                                                        <div
                                                            className={cn(
                                                                "h-full transition-all",
                                                                isCritical ? "bg-red-500" :
                                                                    isHigh ? "bg-amber-500" :
                                                                        "bg-emerald-500"
                                                            )}
                                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-muted-foreground">
                                                        {percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {percentage >= 100 ? (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1 w-fit">
                                                        <TrendingDown className="w-3 h-3" />
                                                        Esgotado
                                                    </span>
                                                ) : isHigh ? (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1 w-fit">
                                                        Alto Uso
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1 w-fit">
                                                        <TrendingUp className="w-3 h-3" />
                                                        Normal
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">
                                        Nenhum histórico disponível ainda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
