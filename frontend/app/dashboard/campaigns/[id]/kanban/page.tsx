"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { AltArrowLeft, Refresh } from '@solar-icons/react'
import { api } from '@/services/api'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { LeadCard } from '@/components/kanban/LeadCard'

interface Lead {
    id: string
    contact: {
        id: string
        name: string
        phone: string
    }
    status: string
    updatedAt: string
}

interface KanbanData {
    PENDING: Lead[]
    SENT: Lead[]
    READ: Lead[]
    REPLIED: Lead[]
    NEGOTIATION: Lead[]
    CONVERTED: Lead[]
    LOST: Lead[]
}

const COLUMNS = [
    { status: 'PENDING', title: 'Na Fila', color: 'bg-gray-50', icon: '📋' },
    { status: 'SENT', title: 'Enviado', color: 'bg-blue-50', icon: '📤' },
    { status: 'READ', title: 'Lido', color: 'bg-purple-50', icon: '👁️' },
    { status: 'REPLIED', title: 'Respondeu', color: 'bg-green-50', icon: '💬' },
    { status: 'NEGOTIATION', title: 'Negociando', color: 'bg-orange-50', icon: '🤝' },
    { status: 'CONVERTED', title: 'Convertido', color: 'bg-emerald-50', icon: '✅' },
    { status: 'LOST', title: 'Perdido', color: 'bg-red-50', icon: '❌' },
]

export default function KanbanPage() {
    const params = useParams()
    const router = useRouter()
    const campaignId = params.id as string

    const [kanbanData, setKanbanData] = useState<KanbanData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeLead, setActiveLead] = useState<Lead | null>(null)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchKanban()
    }, [campaignId])

    const fetchKanban = async () => {
        try {
            setLoading(true)
            const data = await api.campaigns.getKanban(campaignId)
            setKanbanData(data)
        } catch (error) {
            console.error('Error fetching kanban:', error)
            console.error('Failed to load kanban');
        } finally {
            setLoading(false)
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveLead(event.active.data.current as Lead)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveLead(null)

        if (!over || !kanbanData) return

        const leadId = active.id as string
        const newStatus = over.id as string

        // Find the lead and its current status
        let currentStatus = ''
        let lead: Lead | undefined

        for (const [status, leads] of Object.entries(kanbanData)) {
            const foundLead = leads.find(l => l.id === leadId)
            if (foundLead) {
                currentStatus = status
                lead = foundLead
                break
            }
        }

        if (!lead || currentStatus === newStatus) return

        // Optimistic update
        const newKanbanData = { ...kanbanData }
        newKanbanData[currentStatus as keyof KanbanData] = newKanbanData[currentStatus as keyof KanbanData].filter(l => l.id !== leadId)
        newKanbanData[newStatus as keyof KanbanData] = [...newKanbanData[newStatus as keyof KanbanData], { ...lead, updatedAt: new Date().toISOString() }]
        setKanbanData(newKanbanData)

        // Update backend
        try {
            setUpdating(true)
            await api.campaigns.updateLeadStatus(leadId, newStatus)
        } catch (error) {
            console.error('Error updating lead status:', error)
            // Revert on error
            setKanbanData(kanbanData)
            console.error('Failed to update lead status');
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando Kanban...</p>
                </div>
            </div>
        )
    }

    if (!kanbanData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-muted-foreground">Erro ao carregar dados</p>
                    <button
                        onClick={fetchKanban}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        )
    }

    const totalLeads = Object.values(kanbanData).reduce((sum, leads) => sum + leads.length, 0)

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/dashboard/campaigns/${campaignId}`)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                            <AltArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Kanban de Leads</h1>
                            <p className="text-sm text-muted-foreground">{totalLeads} leads no total</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchKanban}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Refresh className={updating ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <div className="flex gap-4 h-full">
                        {COLUMNS.map((column) => (
                            <KanbanColumn
                                key={column.status}
                                title={column.title}
                                status={column.status}
                                leads={kanbanData[column.status as keyof KanbanData] || []}
                                color={column.color}
                                icon={column.icon}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay>
                    {activeLead ? <LeadCard lead={activeLead} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
