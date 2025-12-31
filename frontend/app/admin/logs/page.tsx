"use client"

import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, ShieldAlert, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const data = await api.admin.logs()
            setLogs(data)
        } catch (error) {
            console.error('Failed to load logs:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                        <ShieldAlert className="text-red-500" />
                        Logs do Sistema
                    </h1>
                    <p className="text-zinc-400">Monitoramento de erros e instâncias desconectadas.</p>
                </div>
                <Button onClick={fetchLogs} variant="outline" className="gap-2 border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                    <RefreshCcw className="w-4 h-4" /> Atualizar
                </Button>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Eventos Recentes</CardTitle>
                    <CardDescription className="text-zinc-500">Últimos 50 eventos críticos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                        {loading ? (
                            <div className="text-center py-8 text-zinc-500">Carregando logs...</div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Nenhum erro crítico encontrado.</p>
                                <p className="text-xs mt-2">O sistema está operando normalmente.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
                                        <div className={`p-2 rounded-full ${log.level === 'ERROR' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className={`${log.level === 'ERROR' ? 'border-red-500/20 text-red-400' : 'border-amber-500/20 text-amber-400'}`}>
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
