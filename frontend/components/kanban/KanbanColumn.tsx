import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { LeadCard } from './LeadCard'

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

interface KanbanColumnProps {
    title: string
    status: string
    leads: Lead[]
    color: string
    icon: string
}

export function KanbanColumn({ title, status, leads, color, icon }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    })

    return (
        <div className="flex-shrink-0 w-80">
            <div
                className={cn(
                    "rounded-xl border-2 h-full flex flex-col",
                    isOver ? "border-primary bg-accent/50" : "border-border bg-card"
                )}
            >
                {/* Header */}
                <div className={cn("p-4 border-b border-border", color)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{icon}</span>
                            <h3 className="font-bold text-sm text-foreground">{title}</h3>
                        </div>
                        <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-bold",
                            "bg-background/80 text-foreground"
                        )}>
                            {leads.length}
                        </span>
                    </div>
                </div>

                {/* Droppable Area */}
                <div
                    ref={setNodeRef}
                    className="flex-1 p-4 overflow-y-auto min-h-[200px] max-h-[calc(100vh-300px)]"
                >
                    {leads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <div className="text-4xl mb-2 opacity-20">{icon}</div>
                            <p className="text-sm text-muted-foreground">Nenhum lead</p>
                        </div>
                    ) : (
                        leads.map((lead) => (
                            <LeadCard key={lead.id} lead={lead} />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
