"use client"

import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { AlertTriangle, Star, Loader2, Mail, User, MessageSquareHeart } from 'lucide-react'

interface FeedbackRow {
    id: string
    name: string | null
    email: string | null
    overall_rating: number | null
    ease_rating: number | null
    liked: string | null
    confusing: string | null
    had_error: boolean | null
    error_description: string | null
    improvements: string | null
    created_at: string
}

export default function AdminFeedbackPage() {
    const [rows, setRows] = useState<FeedbackRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        api.feedback.list()
            .then((res: any) => setRows(res.data || []))
            .catch((err: any) => setError(err.message || 'Falha ao carregar feedback'))
            .finally(() => setLoading(false))
    }, [])

    const avgOverall = rows.filter(r => r.overall_rating != null).length
        ? (rows.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / rows.filter(r => r.overall_rating != null).length).toFixed(1)
        : '—'
    const errorCount = rows.filter(r => r.had_error).length

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 shrink-0">
                    <MessageSquareHeart className="size-5 text-primary" />
                </div>
                <div>
                    <h1 className="font-display text-2xl font-extrabold text-zinc-100 tracking-tight">Feedback do Beta</h1>
                    <p className="text-zinc-400 text-sm mt-1">Respostas da página de feedback (linkada em Configurações → Perfil) dos testers do trial.</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                    <p className="text-xs text-zinc-500">Respostas</p>
                    <p className="font-display text-2xl font-extrabold text-zinc-100 mt-1">{rows.length}</p>
                </div>
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                    <p className="text-xs text-zinc-500">Nota média (0-10)</p>
                    <p className="font-display text-2xl font-extrabold text-zinc-100 mt-1">{avgOverall}</p>
                </div>
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                    <p className="text-xs text-zinc-500">Relataram erro</p>
                    <p className="font-display text-2xl font-extrabold text-amber-400 mt-1">{errorCount}</p>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-16 text-zinc-500">
                    <Loader2 className="size-5 animate-spin mr-2" /> Carregando...
                </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            {!loading && !error && rows.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-16">Nenhuma resposta ainda.</p>
            )}

            <div className="space-y-3">
                {rows.map((r) => (
                    <div key={r.id} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {r.overall_rating != null && (
                                    <span className="flex items-center gap-1 text-sm font-bold text-primary">
                                        <Star className="size-3.5" /> {r.overall_rating}/10
                                    </span>
                                )}
                                {r.ease_rating != null && (
                                    <span className="text-xs text-zinc-500">Facilidade: {r.ease_rating}/5</span>
                                )}
                                {r.had_error && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                                        <AlertTriangle className="size-3.5" /> relatou erro
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-zinc-500">{new Date(r.created_at).toLocaleString('pt-BR')}</span>
                        </div>

                        {(r.name || r.email) && (
                            <div className="flex items-center gap-3 text-xs text-zinc-400">
                                {r.name && <span className="flex items-center gap-1"><User className="size-3" /> {r.name}</span>}
                                {r.email && <span className="flex items-center gap-1"><Mail className="size-3" /> {r.email}</span>}
                            </div>
                        )}

                        <div className="grid gap-2 text-sm">
                            {r.liked && <Field label="Gostou" value={r.liked} />}
                            {r.confusing && <Field label="Confundiu/incomodou" value={r.confusing} />}
                            {r.error_description && <Field label="Descrição do erro" value={r.error_description} tone="amber" />}
                            {r.improvements && <Field label="Melhoraria" value={r.improvements} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Field({ label, value, tone }: { label: string; value: string; tone?: 'amber' }) {
    return (
        <div className={`rounded-lg px-3 py-2 ${tone === 'amber' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800/50'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-0.5">{label}</p>
            <p className="text-zinc-200 whitespace-pre-wrap">{value}</p>
        </div>
    )
}
