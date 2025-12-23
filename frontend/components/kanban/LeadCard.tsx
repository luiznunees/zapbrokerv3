import { useDraggable } from '@dnd-kit/core'
import { UserCircle, Smartphone, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface LeadCardProps {
    lead: Lead
}

export function LeadCard({ lead }: LeadCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
        data: lead
    })

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
        if (seconds < 60) return 'agora'
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`
        return `${Math.floor(seconds / 86400)}d atrás`
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "bg-card border border-border rounded-lg p-4 mb-3 cursor-grab active:cursor-grabbing",
                "hover:shadow-md transition-all hover:border-primary/50",
                isDragging && "opacity-50 shadow-xl"
            )}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 bg-accent rounded-lg">
                    <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate">
                        {lead.contact.name}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Smartphone className="w-3 h-3" />
                        <span className="truncate">{lead.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(lead.updatedAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
