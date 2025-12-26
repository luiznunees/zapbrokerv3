"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/services/api'
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    Users,
    Send,
    AlertCircle,
    Search,
    Play,
    Pause
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function CampaignDetailsPage() {
    const params = useParams();
    const id = params.id as string;

    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (id) {
            fetchDetails();
        }
    }, [id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const data = await api.campaigns.getDetails(id);
            setCampaign(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar detalhes da campanha.');
        } finally {
            setLoading(false);
        }
    };

    const checkOnboarding = () => {
        try {
            const saved = localStorage.getItem('onboarding-checklist')
            const savedData = saved ? JSON.parse(saved) : {}

            if (!savedData['view-kanban']) {
                const newData = { ...savedData, 'view-kanban': true }
                localStorage.setItem('onboarding-checklist', JSON.stringify(newData))
                window.dispatchEvent(new Event('onboarding-update'))
            }
        } catch (e) {
            console.error('Error updating onboarding status:', e)
        }
    }

    useEffect(() => {
        if (campaign) {
            checkOnboarding()
        }
    }, [campaign])

    if (loading && !campaign) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Erro</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Link href="/dashboard" className="text-primary hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar para o Dashboard
                </Link>
            </div>
        );
    }

    const messages = campaign?.messages || [];
    const stats = {
        total: messages.length,
        sent: messages.filter((m: any) => m.status === 'SENT').length,
        failed: messages.filter((m: any) => m.status === 'FAILED').length,
        pending: messages.filter((m: any) => m.status === 'PENDING' || m.status === 'QUEUED').length,
    };

    const filteredMessages = messages.filter((m: any) =>
        m.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.contacts?.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground">{campaign?.name}</h1>
                        {campaign?.status === 'PAUSED' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 animate-pulse">
                                PAUSADA
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">Criada em {new Date(campaign?.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3">
                    {/* Pause/Resume Control */}
                    <button
                        onClick={async () => {
                            try {
                                if (campaign.status === 'PAUSED') {
                                    await api.campaigns.resume(id);
                                } else {
                                    await api.campaigns.pause(id);
                                }
                                fetchDetails(); // Refresh UI
                            } catch (err) {
                                console.error('Failed to toggle pause', err);
                                alert('Erro ao alterar status da campanha');
                            }
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                            campaign?.status === 'PAUSED'
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                                : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                        )}
                    >
                        {campaign?.status === 'PAUSED' ? (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                Retomar Envio
                            </>
                        ) : (
                            <>
                                <Pause className="w-4 h-4 fill-current" />
                                Pausar Envio
                            </>
                        )}
                    </button>

                    <Link
                        href={`/dashboard/campaigns/${id}/kanban`}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-primary/20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        Ver Kanban
                    </Link>
                    <button
                        onClick={fetchDetails}
                        disabled={loading}
                        title="Atualizar dados"
                        className="p-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors disabled:opacity-50 border border-border"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total de Contatos" value={stats.total} icon={Users} color="bg-blue-500" />
                <StatCard title="Enviados" value={stats.sent} icon={CheckCircle2} color="bg-emerald-500" />
                <StatCard title="Falhas" value={stats.failed} icon={XCircle} color="bg-rose-500" />
                <StatCard title="Aguardando" value={stats.pending} icon={Clock} color="bg-amber-500" />
            </div>

            {/* Message Content Preview */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" /> Conteúdo da Mensagem
                </h3>
                <div className="bg-accent/30 rounded-lg p-4 text-sm whitespace-pre-wrap border border-border/50">
                    {campaign?.message}
                </div>
                {campaign?.media_url && (
                    <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Mídia Anexada:</p>
                        <a href={campaign.media_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block max-w-xs">
                            {campaign.media_url}
                        </a>
                    </div>
                )}
            </div>

            {/* Contacts List */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="font-semibold text-card-foreground">Lista de Envios</h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar contato..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-accent/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="px-6 py-4">Contato</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Última Atualização</th>
                                <th className="px-6 py-4">Erro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredMessages.length > 0 ? (
                                filteredMessages.map((msg: any) => (
                                    <tr key={msg.id} className="hover:bg-accent/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{msg.contacts?.name || 'Sem Nome'}</div>
                                            <div className="text-xs text-muted-foreground">{msg.contacts?.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={msg.status} />
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {msg.updated_at ? new Date(msg.updated_at).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {msg.error_message ? (
                                                <span className="text-xs text-rose-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {msg.error_message}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground italic">
                                        Nenhum contato encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{title}</span>
                <div className={cn("p-2 rounded-lg text-white", color)}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-card-foreground">{value}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: any = {
        'SENT': { label: 'Enviado', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
        'FAILED': { label: 'Falhou', class: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
        'PENDING': { label: 'Pendente', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
        'QUEUED': { label: 'Na Fila', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    };

    const config = configs[status] || { label: status, class: 'bg-muted text-muted-foreground' };

    return (
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", config.class)}>
            {config.label}
        </span>
    );
}
