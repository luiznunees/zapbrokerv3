import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { TrendingUp, AlertCircle, Infinity as InfinityIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuotaData {
    plan: string | null
    unlimited?: boolean
    quota: {
        limit: number
        used: number
        remaining: number
        percentage: string
    } | null
}

export function QuotaWidget() {
    const [quota, setQuota] = useState<QuotaData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQuota()
        }, 1000)

        return () => clearTimeout(timer)
    }, [])

    const fetchQuota = async () => {
        try {
            setLoading(true)
            const data = await api.quotas.current()
            setQuota(data)
            setError(null)
        } catch (err: any) {
            console.error('Error fetching quota:', err)
            setError(err.message || 'Erro ao carregar quota')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm animate-pulse">
                <div className="h-6 w-24 bg-muted rounded mb-4" />
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-3 w-full bg-muted rounded" />
            </div>
        )
    }

    if (error || !quota || !quota.plan) {
        return (
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                        {quota?.plan === null ? 'Nenhum plano ativo' : 'Cota indisponível'}
                    </p>
                </div>
            </div>
        )
    }

    if (quota.unlimited || !quota.quota) {
        return (
            <div className="bg-card border border-border p-6 rounded-xl hover:border-primary/50 transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <InfinityIcon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full text-emerald-500 bg-emerald-500/10">
                        Ilimitado
                    </span>
                </div>
                <div className="text-2xl font-bold text-card-foreground mb-1 min-h-[32px]">Liberado</div>
                <p className="text-sm text-muted-foreground">Disparos sem limite de campanhas</p>
            </div>
        )
    }

    const percentage = parseFloat(quota.quota.percentage)
    const isLow = percentage > 80
    const isCritical = percentage > 95

    return (
        <div className="bg-card border border-border p-6 rounded-xl hover:border-primary/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className={cn(
                    "p-2 rounded-lg",
                    isCritical ? "bg-red-500/10" :
                        isLow ? "bg-amber-500/10" :
                            "bg-accent"
                )}>
                    <TrendingUp className={cn(
                        "w-5 h-5",
                        isCritical ? "text-red-500" :
                            isLow ? "text-amber-500" :
                                "text-primary"
                    )} />
                </div>
                <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    isCritical ? "text-red-500 bg-red-500/10" :
                        isLow ? "text-amber-500 bg-amber-500/10" :
                            "text-emerald-500 bg-emerald-500/10"
                )}>
                    {percentage.toFixed(0)}%
                </span>
            </div>

            <div className="text-2xl font-bold text-card-foreground mb-1 min-h-[32px]">
                {quota.quota.remaining.toLocaleString()}
            </div>

            <p className="text-sm text-muted-foreground mb-3">Campanhas restantes este mês</p>

            <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-500",
                        isCritical ? "bg-red-500" :
                            isLow ? "bg-amber-500" :
                                "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            {isLow && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {isCritical ? "Cota crítica!" : "Uso elevado"}
                </p>
            )}
        </div>
    )
}
