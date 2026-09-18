"use client"

import { useState } from 'react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCopy, Terminal, Check } from 'lucide-react'

function todayISO() {
    return new Date().toISOString().slice(0, 10)
}

export default function AdminRawActivityLogsPage() {
    const [from, setFrom] = useState(todayISO())
    const [to, setTo] = useState(todayISO())
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [result, setResult] = useState<{ count: number; truncated: boolean; chars: number } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleCopy = async () => {
        setLoading(true)
        setError(null)
        setCopied(false)
        try {
            // "to" e so a data (00:00) — soma 1 dia pra cobrir o dia inteiro selecionado.
            const toEndOfDay = new Date(`${to}T00:00:00`)
            toEndOfDay.setDate(toEndOfDay.getDate() + 1)

            const data = await api.admin.rawActivityLogs(
                new Date(`${from}T00:00:00`).toISOString(),
                toEndOfDay.toISOString()
            )
            await navigator.clipboard.writeText(data.text || '')
            setResult({ count: data.count, truncated: data.truncated, chars: (data.text || '').length })
            setCopied(true)
            setTimeout(() => setCopied(false), 4000)
        } catch (err: any) {
            console.error('Failed to copy raw activity logs:', err)
            setError(err?.message || 'Erro ao gerar o log.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                    <Terminal className="text-sky-500" />
                    Log Bruto de Atividade
                </h1>
                <p className="text-zinc-400">
                    Toda ação que muda estado no backend (criar campanha, enviar disparo, conectar
                    WhatsApp, login, etc.), de todos os usuários. Sem filtro nem formatação bonita — é
                    pra copiar um período e colar direto numa conversa de análise.
                </p>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Exportar período</CardTitle>
                    <CardDescription className="text-zinc-500">
                        Escolha o intervalo de datas e clique em copiar — o texto vai direto pra área de
                        transferência.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 font-medium">De</label>
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 font-medium">Até</label>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200"
                            />
                        </div>
                        <Button onClick={handleCopy} disabled={loading} className="gap-2">
                            {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                            {loading ? 'Gerando...' : copied ? 'Copiado!' : 'Copiar log do período'}
                        </Button>
                    </div>

                    {result && (
                        <p className="text-xs text-zinc-500 font-mono">
                            {result.count} eventos · {result.chars.toLocaleString('pt-BR')} caracteres
                            {result.truncated ? ' · truncado (período tem mais eventos que o limite — reduza o intervalo)' : ''}
                        </p>
                    )}
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </CardContent>
            </Card>
        </div>
    )
}
