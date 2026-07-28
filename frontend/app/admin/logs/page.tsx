"use client"

import { useEffect, useRef, useState } from 'react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, ShieldAlert, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

const SEVERITY_FILTERS = [
    { label: 'Todos', value: '' },
    { label: 'Crítico', value: 'critical' },
    { label: 'Erro', value: 'error' },
    { label: 'Aviso', value: 'warn' },
    { label: 'Info', value: 'info' },
]

const LEVEL_STYLES: Record<string, string> = {
    CRITICAL: 'bg-red-600/10 text-red-500 border-red-600/20',
    ERROR: 'bg-red-500/10 text-red-500 border-red-500/20 text-red-400',
    WARN: 'bg-amber-500/10 text-amber-500 border-amber-500/20 text-amber-400',
    INFO: 'bg-sky-500/10 text-sky-500 border-sky-500/20 text-sky-400',
}

const POLL_INTERVAL_MS = 20000

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [severity, setSeverity] = useState('')
    const severityRef = useRef(severity)
    severityRef.current = severity

    const fetchLogs = async (showSpinner = true) => {
        if (showSpinner) setLoading(true)
        try {
            const data = await api.admin.logs(severityRef.current || undefined)
            setLogs(data)
        } catch (error) {
            console.error('Failed to load logs:', error)
        } finally {
            if (showSpinner) setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [severity])

    useEffect(() => {
        const interval = setInterval(() => fetchLogs(false), POLL_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                        <ShieldAlert className="text-red-500" />
                        Logs do Sistema
                    </h1>
                    <p className="text-zinc-400">Eventos reais do sistema — atualiza automaticamente a cada 20s.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                        {SEVERITY_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setSeverity(f.value)}
                                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${severity === f.value ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <Button onClick={() => fetchLogs()} variant="outline" className="gap-2 border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                        <RefreshCcw className="w-4 h-4" /> Atualizar
                    </Button>
                </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Eventos Recentes</CardTitle>
                    <CardDescription className="text-zinc-500">Últimos eventos do sistema (autenticação, WhatsApp, campanhas, pagamentos, admin).</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                        {loading ? (
                            <div className="text-center py-8 text-zinc-500">Carregando logs...</div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Nenhum evento encontrado.</p>
                                <p className="text-xs mt-2">O sistema está operando normalmente.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
                                        <div className={`p-2 rounded-full ${LEVEL_STYLES[log.level] || LEVEL_STYLES.INFO}`}>
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className={LEVEL_STYLES[log.level] || LEVEL_STYLES.INFO}>
                                                    {log.level}
                                                </Badge>
                                                <span className="text-xs font-mono text-zinc-500">
                                                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                                                </span>
                                            </div>
                                            <p className="text-zinc-300 font-medium">{log.message}</p>
                                            <p className="text-xs text-zinc-500 font-mono">Source: {log.source}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
