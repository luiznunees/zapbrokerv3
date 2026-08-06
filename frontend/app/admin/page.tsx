"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, AlertTriangle, MessageSquare, Server, ArrowRight, Zap } from 'lucide-react'

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [aiCredits, setAiCredits] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [statsData, creditsData] = await Promise.all([
                    api.admin.stats(),
                    api.admin.aiCredits().catch(() => null),
                ])
                setStats(statsData)
                setAiCredits(creditsData)
            } catch (error) {
                console.error('Failed to load admin stats:', error)
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [])

    if (loading) return <div className="p-8 text-zinc-400">Carregando estatísticas...</div>

    const creditsNeedAttention = aiCredits?.configured && (aiCredits.status === 'empty' || aiCredits.status === 'low')
    const hasAnyAlert = stats?.activeErrors > 0 || stats?.recentCriticalEvents > 0 || creditsNeedAttention

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-zinc-100">Visão Geral do Sistema</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Usuários"
                    value={stats?.users || 0}
                    icon={Users}
                    color="text-primary"
                />
                <StatCard
                    title="Instâncias Ativas"
                    value={stats?.activeInstances || 0}
                    icon={Server}
                    color="text-emerald-500"
                />
                <StatCard
                    title="Mensagens Hoje"
                    value={stats?.messagesToday || 0}
                    icon={MessageSquare}
                    color="text-primary"
                />
                <StatCard
                    title="Erros (Instâncias)"
                    value={stats?.activeErrors || 0}
                    icon={AlertTriangle}
                    color="text-red-500"
                />
            </div>

            {/* Placeholder for charts or recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Logs Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/admin/logs"
                            className="flex items-center justify-between text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
                        >
                            <span>Ver eventos críticos e instâncias desconectadas</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Alertas do Sistema</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {hasAnyAlert ? (
                            <>
                                {(stats?.activeErrors > 0 || stats?.recentCriticalEvents > 0) && (
                                    <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <span>
                                            {stats.activeErrors > 0 && `${stats.activeErrors} instância(s) com erro de conexão`}
                                            {stats.activeErrors > 0 && stats.recentCriticalEvents > 0 && ' — '}
                                            {stats.recentCriticalEvents > 0 && `${stats.recentCriticalEvents} evento(s) crítico(s) nas últimas 24h`}
                                        </span>
                                    </div>
                                )}
                                {creditsNeedAttention && (
                                    <div className={`p-4 rounded-lg flex items-center gap-2 ${aiCredits.status === 'empty' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        <Zap className="w-5 h-5 shrink-0" />
                                        <span className="flex-1">
                                            {aiCredits.status === 'empty'
                                                ? 'Créditos do OpenRouter zerados — o agente está caindo pro provedor de fallback.'
                                                : `Créditos do OpenRouter baixos (~$${aiCredits.remaining?.toFixed(2)}).`}
                                        </span>
                                        <a
                                            href="https://openrouter.ai/settings/credits"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold underline shrink-0"
                                        >
                                            Recarregar
                                        </a>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-emerald-500 flex items-center gap-2">
                                <Server className="w-5 h-5" />
                                <span>Todos os sistemas operacionais.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-400">{title}</p>
                    <h3 className="text-3xl font-bold text-zinc-100 mt-2">{value}</h3>
                </div>
                <div className={`p-4 rounded-full bg-zinc-800/50 ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
    )
}
