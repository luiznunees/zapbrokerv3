"use client"

import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Cpu } from 'lucide-react'

interface FinanceOverview {
    period: { startDate: string; endDate: string }
    revenue: { totalBRL: number; paymentCount: number; byPlan: Record<string, number> }
    cost: {
        totalUsd: number
        totalBRL: number
        aiCallCount: number
        byProvider: Record<string, number>
        topUsers: Array<{ userId: string; name: string; email: string; costUsd: number; costBRL: number }>
    }
    profit: { totalBRL: number; marginPct: number }
    exchangeRateUsed: number
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminFinancePage() {
    const [data, setData] = useState<FinanceOverview | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        api.admin.finance()
            .then((res: FinanceOverview) => setData(res))
            .catch((err: any) => setError(err.message || 'Erro ao carregar dados financeiros'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="p-8 text-zinc-400">Carregando dados financeiros...</div>
    if (error || !data) return <div className="p-8 text-red-400">{error || 'Sem dados disponíveis.'}</div>

    const isProfitable = data.profit.totalBRL >= 0

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-zinc-100">Financeiro</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Mês atual · câmbio usado: 1 USD ≈ {brl(data.exchangeRateUsed)}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-zinc-400">Faturamento</p>
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-zinc-100">{brl(data.revenue.totalBRL)}</h3>
                        <p className="text-xs text-zinc-500 mt-2">{data.revenue.paymentCount} pagamento(s) confirmado(s)</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-zinc-400">Custo de IA</p>
                            <Cpu className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-zinc-100">{brl(data.cost.totalBRL)}</h3>
                        <p className="text-xs text-zinc-500 mt-2">
                            {data.cost.aiCallCount} chamada(s) · ${data.cost.totalUsd.toFixed(4)} USD
                        </p>
                    </CardContent>
                </Card>

                <Card className={`bg-zinc-900 border-zinc-800 ${isProfitable ? '' : 'border-red-900/50'}`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-zinc-400">Lucro estimado</p>
                            {isProfitable
                                ? <TrendingUp className="w-5 h-5 text-emerald-500" />
                                : <TrendingDown className="w-5 h-5 text-red-500" />}
                        </div>
                        <h3 className={`text-3xl font-bold ${isProfitable ? 'text-zinc-100' : 'text-red-400'}`}>
                            {brl(data.profit.totalBRL)}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-2">
                            margem: {data.profit.marginPct.toFixed(1)}%
                            <span className="block mt-1 text-zinc-600">(não inclui infra fixa — só custo de IA)</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-zinc-100 text-base">Receita por plano</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {Object.entries(data.revenue.byPlan).length === 0 && (
                            <p className="text-sm text-zinc-500">Nenhum pagamento confirmado no período.</p>
                        )}
                        {Object.entries(data.revenue.byPlan).map(([plan, value]) => (
                            <div key={plan} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">{plan}</span>
                                <span className="text-zinc-100 font-medium">{brl(value)}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-zinc-100 text-base">Custo de IA por provedor</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {Object.entries(data.cost.byProvider).length === 0 && (
                            <p className="text-sm text-zinc-500">Nenhuma chamada de IA registrada no período.</p>
                        )}
                        {Object.entries(data.cost.byProvider).map(([provider, usd]) => (
                            <div key={provider} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400 capitalize">{provider}</span>
                                <span className="text-zinc-100 font-medium">{brl(Number(usd) * data.exchangeRateUsed)}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-zinc-100 text-base">Usuários que mais custam em IA</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.cost.topUsers.length === 0 ? (
                        <p className="text-sm text-zinc-500">Sem dados ainda.</p>
                    ) : (
                        <div className="space-y-2">
                            {data.cost.topUsers.map((u) => (
                                <div key={u.userId} className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-800 last:border-0">
                                    <div>
                                        <p className="text-zinc-100">{u.name}</p>
                                        <p className="text-xs text-zinc-500">{u.email}</p>
                                    </div>
                                    <span className="text-zinc-100 font-medium">{brl(u.costBRL)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
