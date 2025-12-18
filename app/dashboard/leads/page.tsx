"use client"
import { useState } from 'react'
import { MoreHorizontal, Plus, Calendar, DollarSign, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Lead = {
    id: string
    name: string
    value: string
    source: string
    lastActivity: string
}

type Column = {
    id: string
    title: string
    color: string
    leads: Lead[]
}

const initialColumns: Column[] = [
    {
        id: 'new',
        title: '📥 Novos',
        color: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
        leads: [
            { id: '1', name: 'Roberto Almeida', value: 'R$ 850k', source: 'Instagram', lastActivity: '5 min' },
            { id: '2', name: 'Julia Silva', value: 'R$ 1.2M', source: 'Portal Zap', lastActivity: '12 min' }
        ]
    },
    {
        id: 'talking',
        title: '💬 Em Conversa',
        color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
        leads: [
            { id: '3', name: 'Marcos Paulo', value: 'R$ 550k', source: 'Indicação', lastActivity: '1h' }
        ]
    },
    {
        id: 'visit',
        title: '📅 Visita Agendada',
        color: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
        leads: [
            { id: '4', name: 'Ana Clara', value: 'R$ 2.4M', source: 'Google Ads', lastActivity: 'Ontem' }
        ]
    },
    {
        id: 'proposal',
        title: '💰 Proposta',
        color: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
        leads: []
    },
    {
        id: 'closed',
        title: '✅ Fechado',
        color: 'bg-green-500/10 border-green-500/20 text-green-500',
        leads: [
            { id: '5', name: 'Construtora XYZ', value: 'R$ 5.0M', source: 'Networking', lastActivity: '3 dias' }
        ]
    }
]

export default function LeadsPage() {
    const [columns, setColumns] = useState(initialColumns)

    return (
        <div className="p-6 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestão de Leads</h1>
                    <p className="text-muted-foreground">Pipeline de vendas visual</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4" /> Novo Lead
                </button>
            </header>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-6 h-full min-w-[1200px]">
                    {columns.map((col) => (
                        <div key={col.id} className="w-80 flex flex-col h-full rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                            {/* Column Header */}
                            <div className={`p-4 border-b border-border/50 flex justify-between items-center ${col.color} bg-opacity-10 rounded-t-xl`}>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm uppercase tracking-wider">{col.title}</h3>
                                    <span className="bg-background/20 px-2 py-0.5 rounded-full text-xs font-bold">{col.leads.length}</span>
                                </div>
                                <MoreHorizontal className="w-4 h-4 opacity-50 hover:opacity-100 cursor-pointer" />
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                                {col.leads.map((lead) => (
                                    <div key={lead.id} className="bg-background p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group hover:border-primary/30">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm">{lead.name}</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">{lead.source}</p>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded transition-all">
                                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-medium px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" /> {lead.value}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {lead.lastActivity}
                                            </div>
                                            <div className="flex items-center gap-1 text-primary hover:underline">
                                                <MessageCircle className="w-3 h-3" /> Ver conversa
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {col.leads.length === 0 && (
                                    <div className="h-24 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground/50 text-sm">
                                        Vazio
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
