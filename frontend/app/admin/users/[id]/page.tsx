"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    ArrowLeft, Check, ClipboardCopy, MessageSquare, Pause, Play, RefreshCw, Rocket,
    Smartphone, Terminal, TriangleAlert, User, List, Radio,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Tela de suporte de UM cliente: tudo que ele está usando (WhatsApps, listas, campanhas com
// placar de envio e erros), o log bruto só dele ao vivo, e as conversas com o agente — pra
// entender e arrumar o problema sem precisar pedir print nem rodar SQL.

type Tab = 'overview' | 'whatsapps' | 'campaigns' | 'lists' | 'rawlog' | 'conversations' | 'events'

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
    { id: 'overview', label: 'Visão geral', icon: User },
    { id: 'whatsapps', label: 'WhatsApps', icon: Smartphone },
    { id: 'campaigns', label: 'Campanhas', icon: Rocket },
    { id: 'lists', label: 'Listas', icon: List },
    { id: 'rawlog', label: 'Log bruto', icon: Terminal },
    { id: 'conversations', label: 'Conversas com o agente', icon: MessageSquare },
    { id: 'events', label: 'Eventos', icon: TriangleAlert },
]

const FAILURE_STATUSES = ['FAILED', 'ERROR']

function fmt(date?: string | null) {
    if (!date) return '—'
    return format(new Date(date), 'dd/MM HH:mm')
}

function ago(date?: string | null) {
    if (!date) return '—'
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

function CopyButton({ getText, label }: { getText: () => string | Promise<string>; label: string }) {
    const [copied, setCopied] = useState(false)
    const [busy, setBusy] = useState(false)
    return (
        <Button
            size="sm"
            disabled={busy}
            className="rounded-full font-bold gap-2"
            onClick={async () => {
                setBusy(true)
                try {
                    await navigator.clipboard.writeText(await getText())
                    setCopied(true)
                    setTimeout(() => setCopied(false), 3000)
                } finally {
                    setBusy(false)
                }
            }}
        >
            {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
            {copied ? 'Copiado!' : label}
        </Button>
    )
}

function StatusBadge({ status }: { status: string }) {
    const tone =
        status === 'connected' || status === 'COMPLETED' || status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400'
        : status === 'RUNNING' || status === 'PENDING' || status === 'QUEUED' || status === 'connecting' ? 'bg-sky-500/10 text-sky-400'
        : status === 'PAUSED' || status === 'SCHEDULED' ? 'bg-amber-500/10 text-amber-400'
        : FAILURE_STATUSES.includes(status) || status === 'disconnected' || status === 'error' || status === 'CANCELLED' ? 'bg-red-500/10 text-red-400'
        : 'bg-zinc-700/50 text-zinc-300'
    return <Badge className={cn('rounded-full font-mono text-[11px] border-0', tone)}>{status}</Badge>
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-semibold">{label}</p>
            <div className="text-sm text-zinc-200 break-words">{value ?? '—'}</div>
        </div>
    )
}

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [tab, setTab] = useState<Tab>('overview')
    const [detail, setDetail] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const loadDetail = useCallback(async () => {
        setRefreshing(true)
        try {
            setDetail(await api.admin.userDetail(id))
            setError(null)
        } catch (err: any) {
            setError(err?.message || 'Erro ao carregar o cliente.')
        } finally {
            setRefreshing(false)
        }
    }, [id])

    // Atualiza sozinho a cada 20s — campanha rodando muda o placar o tempo todo.
    useEffect(() => {
        loadDetail()
        const t = setInterval(loadDetail, 20000)
        return () => clearInterval(t)
    }, [loadDetail])

    if (error && !detail) {
        return (
            <div className="space-y-4">
                <BackLink />
                <p className="text-red-400">{error}</p>
            </div>
        )
    }
    if (!detail) return <p className="text-zinc-500">Carregando...</p>

    const { user, subscription, instances, campaigns, lists, events, sessions } = detail
    const disconnected = instances.filter((i: any) => i.status !== 'connected')
    const campaignsWithFailures = campaigns.filter((c: any) => FAILURE_STATUSES.some((s) => c.messageCounts[s]))
    const recentErrors = events.filter((e: any) => e.severity === 'error' || e.severity === 'critical' || e.severity === 'warn')

    return (
        <div className="space-y-6">
            <BackLink />

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-extrabold text-zinc-100 tracking-tight">{user.name}</h1>
                    <p className="text-zinc-400 text-sm">{user.email} · último acesso {ago(user.last_active_at)}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDetail}
                    disabled={refreshing}
                    className="rounded-full border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 gap-2"
                >
                    <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} /> Atualizar
                </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors',
                            tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        )}
                    >
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {tab === 'overview' && (
                <div className="space-y-4">
                    {(disconnected.length > 0 || campaignsWithFailures.length > 0) && (
                        <Card className="bg-red-500/5 border-red-500/20 rounded-3xl">
                            <CardContent className="pt-6 space-y-1 text-sm text-red-300">
                                {disconnected.map((i: any) => (
                                    <p key={i.id}>⚠️ WhatsApp "{i.name}" está {i.status} desde {fmt(i.status_since)}</p>
                                ))}
                                {campaignsWithFailures.map((c: any) => (
                                    <p key={c.id}>⚠️ Campanha "{c.name}" tem {FAILURE_STATUSES.reduce((n, s) => n + (c.messageCounts[s] || 0), 0)} envio(s) com falha</p>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                    <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                        <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-5">
                            <Field label="Plano" value={subscription ? `${subscription.plan_id} (${subscription.status})` : 'sem assinatura'} />
                            <Field label="Teste termina" value={fmt(subscription?.trial_ends_at)} />
                            <Field label="Cadastro" value={fmt(user.created_at)} />
                            <Field label="Papel" value={user.role} />
                            <Field label="WhatsApps" value={`${instances.length - disconnected.length} conectado(s) de ${instances.length}`} />
                            <Field label="Campanhas" value={campaigns.length} />
                            <Field label="Listas" value={lists.length} />
                            <Field label="Conversas com o agente" value={sessions.length} />
                            <Field label="Cidade" value={user.onboarding_steps?.broker_context?.city} />
                            <Field label="Chips (onboarding)" value={user.onboarding_steps?.broker_context?.chipCount} />
                            <Field label="Meta VGV" value={user.onboarding_steps?.vgvGoal} />
                            <Field label="Eventos de alerta" value={recentErrors.length} />
                        </CardContent>
                    </Card>
                </div>
            )}

            {tab === 'whatsapps' && (
                <div className="grid gap-4 md:grid-cols-2">
                    {instances.length === 0 && <p className="text-zinc-500">Nenhum WhatsApp cadastrado.</p>}
                    {instances.map((i: any) => (
                        <Card key={i.id} className="bg-zinc-900 border-zinc-800 rounded-3xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="font-display font-bold text-zinc-100">{i.name}</CardTitle>
                                <StatusBadge status={i.status} />
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <Field label="Número" value={i.phone_number} />
                                <Field label="Status desde" value={fmt(i.status_since)} />
                                <Field label="Conectado em" value={fmt(i.connected_at)} />
                                <Field label="Idade do chip (informada)" value={i.self_reported_chip_days != null ? `${i.self_reported_chip_days} dia(s)` : 'não informada'} />
                                <Field label="Instável desde" value={i.unstable_since ? fmt(i.unstable_since) : 'estável'} />
                                <Field label="ID" value={<span className="font-mono text-xs text-zinc-500">{i.id}</span>} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {tab === 'campaigns' && <CampaignsTab userId={id} campaigns={campaigns} onChanged={loadDetail} />}

            {tab === 'lists' && (
                <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                    <CardContent className="pt-6 divide-y divide-zinc-800">
                        {lists.length === 0 && <p className="text-zinc-500">Nenhuma lista.</p>}
                        {lists.map((l: any) => (
                            <div key={l.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-semibold text-zinc-100">{l.name}</p>
                                    <p className="text-xs text-zinc-500">criada {fmt(l.created_at)}</p>
                                </div>
                                <span className={cn('font-mono text-sm', l.contactCount === 0 ? 'text-red-400' : 'text-zinc-300')}>
                                    {l.contactCount} contato(s)
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {tab === 'rawlog' && <RawLogTab userId={id} />}

            {tab === 'conversations' && <ConversationsTab userId={id} sessions={sessions} />}

            {tab === 'events' && (
                <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                    <CardContent className="pt-6 space-y-2">
                        {events.length === 0 && <p className="text-zinc-500">Nenhum evento.</p>}
                        {events.map((e: any) => (
                            <div key={e.id} className="flex gap-3 text-sm">
                                <span className="text-zinc-500 font-mono shrink-0">{fmt(e.created_at)}</span>
                                <span className={cn('font-mono shrink-0',
                                    e.severity === 'error' || e.severity === 'critical' ? 'text-red-400'
                                    : e.severity === 'warn' ? 'text-amber-400' : 'text-zinc-500')}>
                                    {e.type}
                                </span>
                                <span className="text-zinc-300">{e.message}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function BackLink() {
    return (
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="w-4 h-4" /> Usuários
        </Link>
    )
}

function CampaignsTab({ userId, campaigns, onChanged }: { userId: string; campaigns: any[]; onChanged: () => void }) {
    const [busyId, setBusyId] = useState<string | null>(null)

    const toggle = async (c: any) => {
        const action = c.status === 'PAUSED' ? 'resume' : 'pause'
        if (!confirm(`${action === 'pause' ? 'Pausar' : 'Retomar'} a campanha "${c.name}" deste cliente?`)) return
        setBusyId(c.id)
        try {
            await api.admin.setUserCampaignPaused(userId, c.id, action)
            onChanged()
        } catch (err: any) {
            alert(err?.message || 'Não consegui alterar a campanha.')
        } finally {
            setBusyId(null)
        }
    }

    if (campaigns.length === 0) return <p className="text-zinc-500">Nenhuma campanha.</p>

    return (
        <div className="space-y-4">
            {campaigns.map((c) => {
                const total = Object.values(c.messageCounts as Record<string, number>).reduce((a, b) => a + b, 0)
                const canToggle = ['RUNNING', 'PENDING', 'PAUSED'].includes(c.status)
                return (
                    <Card key={c.id} className="bg-zinc-900 border-zinc-800 rounded-3xl">
                        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                            <div className="space-y-1 min-w-0">
                                <CardTitle className="font-display font-bold text-zinc-100 truncate">{c.name}</CardTitle>
                                <CardDescription className="text-zinc-500">
                                    criada {fmt(c.created_at)} · lista {c.listName ?? '—'} · {c.instanceNames.join(' + ') || 'sem número'}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <StatusBadge status={c.status} />
                                {canToggle && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busyId === c.id}
                                        onClick={() => toggle(c)}
                                        className="rounded-full border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 gap-1"
                                    >
                                        {c.status === 'PAUSED' ? <><Play className="w-3 h-3" /> Retomar</> : <><Pause className="w-3 h-3" /> Pausar</>}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {total === 0 && <span className="text-sm text-zinc-500">Nenhuma mensagem gerada ainda.</span>}
                                {Object.entries(c.messageCounts as Record<string, number>).map(([status, n]) => (
                                    <span key={status} className="flex items-center gap-1.5 text-sm">
                                        <StatusBadge status={status} /> <span className="text-zinc-300 font-mono">{n}</span>
                                    </span>
                                ))}
                                {total > 0 && <span className="text-sm text-zinc-500">de {total} · última atualização {ago(c.lastMessageUpdate)}</span>}
                            </div>

                            {c.errors.length > 0 && (
                                <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-3 space-y-1">
                                    {c.errors.map((e: any) => (
                                        <p key={e.message} className="text-sm text-red-300 font-mono">{e.count}× {e.message}</p>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Field label="Intervalo" value={`${c.delay_seconds}s`} />
                                <Field label="Lote" value={`${c.batch_size} a cada ${c.batch_delay_seconds}s`} />
                                <Field label="Modo sequencial" value={c.sequential_mode ? 'sim' : 'não'} />
                                <Field label="Mídia" value={c.media_url ? c.media_type : 'só texto'} />
                            </div>

                            <details className="text-sm">
                                <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300">Ver mensagem</summary>
                                <pre className="mt-2 whitespace-pre-wrap text-zinc-300 bg-zinc-950 rounded-2xl p-3 font-sans">{c.message}</pre>
                                <p className="mt-1 font-mono text-xs text-zinc-600">{c.id}</p>
                            </details>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

// Log bruto só desse cliente, ao vivo: carrega as últimas linhas e depois pergunta a cada 3s
// só o que chegou depois da última. "Copiar" leva exatamente o texto que está na tela.
function RawLogTab({ userId }: { userId: string }) {
    const [entries, setEntries] = useState<Array<{ id: string; createdAt: string; text: string }>>([])
    const [live, setLive] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const boxRef = useRef<HTMLPreElement>(null)
    const lastRef = useRef<string | undefined>(undefined)
    const stickToBottom = useRef(true)

    const append = useCallback((incoming: Array<{ id: string; createdAt: string; text: string }>) => {
        if (incoming.length === 0) return
        setEntries((prev) => {
            const seen = new Set(prev.map((e) => e.id))
            const merged = [...prev, ...incoming.filter((e) => !seen.has(e.id))]
            return merged.slice(-2000)
        })
        lastRef.current = incoming[incoming.length - 1].createdAt
    }, [])

    useEffect(() => {
        setEntries([])
        lastRef.current = undefined
        api.admin.userRawLogs(userId)
            .then((res: any) => { append(res.entries || []); setError(null) })
            .catch((err: any) => setError(err?.message || 'Erro ao carregar o log.'))
    }, [userId, append])

    useEffect(() => {
        if (!live) return
        const t = setInterval(async () => {
            try {
                const res = await api.admin.userRawLogs(userId, lastRef.current)
                append(res.entries || [])
            } catch {
                // falha pontual de rede: tenta de novo no próximo ciclo
            }
        }, 3000)
        return () => clearInterval(t)
    }, [live, userId, append])

    useEffect(() => {
        if (stickToBottom.current && boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
    }, [entries])

    const text = entries.map((e) => e.text).join('\n---\n')

    return (
        <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <div>
                    <CardTitle className="font-display font-bold text-zinc-100 flex items-center gap-2">
                        Log bruto
                        {live && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400"><Radio className="w-3 h-3 animate-pulse" /> ao vivo</span>}
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Toda ação desse cliente que muda algo no sistema (inclui tentativas de login com o email dele). {entries.length} linha(s).
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLive((v) => !v)}
                        className="rounded-full border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 gap-1"
                    >
                        {live ? <><Pause className="w-3 h-3" /> Pausar</> : <><Play className="w-3 h-3" /> Ao vivo</>}
                    </Button>
                    <CopyButton label="Copiar log" getText={() => text} />
                </div>
            </CardHeader>
            <CardContent>
                {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
                <pre
                    ref={boxRef}
                    onScroll={(e) => {
                        const el = e.currentTarget
                        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
                    }}
                    className="h-[65vh] overflow-auto bg-zinc-950 rounded-2xl p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap break-all"
                >
                    {text || 'Nenhuma atividade registrada ainda.'}
                </pre>
            </CardContent>
        </Card>
    )
}

function ConversationsTab({ userId, sessions }: { userId: string; sessions: any[] }) {
    const [sessionId, setSessionId] = useState<string>('')
    const [days, setDays] = useState(7)
    const [data, setData] = useState<{ text: string; count: number } | null>(null)
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setData(await api.admin.userConversations(userId, sessionId ? { sessionId } : { days }))
        } finally {
            setLoading(false)
        }
    }, [userId, sessionId, days])

    useEffect(() => { load() }, [load])

    return (
        <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 max-w-[280px]"
                    >
                        <option value="">Todas as conversas</option>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>{fmt(s.updated_at)} · {s.title}</option>
                        ))}
                    </select>
                    {!sessionId && (
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200"
                        >
                            <option value={1}>último dia</option>
                            <option value={3}>últimos 3 dias</option>
                            <option value={7}>últimos 7 dias</option>
                            <option value={30}>últimos 30 dias</option>
                        </select>
                    )}
                    <Button size="sm" variant="outline" onClick={load} disabled={loading} className="rounded-full border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 gap-1">
                        <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} /> Atualizar
                    </Button>
                </div>
                <CopyButton label="Copiar conversas" getText={() => data?.text || ''} />
            </CardHeader>
            <CardContent>
                <p className="text-xs text-zinc-500 mb-2">{data ? `${data.count} mensagem(ns), com eventos de sistema intercalados` : ''}</p>
                <pre className="h-[65vh] overflow-auto bg-zinc-950 rounded-2xl p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                    {loading && !data ? 'Carregando...' : data?.text || 'Nenhuma conversa no período.'}
                </pre>
            </CardContent>
        </Card>
    )
}
