import { useState, useEffect } from 'react'
import { Check, Circle, Zap, Users, Send, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'

interface ChecklistItem {
    id: string
    title: string
    description: string
    completed: boolean
    icon: any
    link?: string
    onAction?: () => void
}

interface OnboardingChecklistProps {
    onConnectWhatsApp?: () => void
}

export function OnboardingChecklist({ onConnectWhatsApp }: OnboardingChecklistProps = {}) {
    const [items, setItems] = useState<ChecklistItem[]>([
        {
            id: 'connect-whatsapp',
            title: 'Conectar WhatsApp',
            description: 'Configure sua primeira instância',
            completed: false,
            icon: Zap,
            link: '/dashboard/settings?tab=whatsapp'
        },
        {
            id: 'import-contacts',
            title: 'Importar Contatos',
            description: 'Adicione sua primeira lista',
            completed: false,
            icon: Users,
            link: '/dashboard/leads'
        },
        {
            id: 'create-campaign',
            title: 'Criar Campanha',
            description: 'Envie sua primeira mensagem',
            completed: false,
            icon: Send,
            link: '/dashboard/campaigns'
        },
        {
            id: 'view-kanban',
            title: 'Ver Resultados',
            description: 'Acompanhe seus leads',
            completed: false,
            icon: BarChart3,
            link: '/dashboard/campaigns'
        }
    ])

    const [isExpanded, setIsExpanded] = useState(true)
    const [loading, setLoading] = useState(true)

    // Icons map isn't strictly needed if we hardcode in state above, but good for reference if we fetched dynamic config

    useEffect(() => {
        const loadFromBackend = async () => {
            try {
                const { user } = await api.auth.profile();
                const savedData = user.onboarding_steps || {};

                setItems(prevItems =>
                    prevItems.map(item => ({
                        ...item,
                        completed: savedData[item.id] || false
                    }))
                );
            } catch (e) {
                console.error('Error loading checklist from backend:', e);
            } finally {
                setLoading(false);
            }
        }

        // Initial load
        loadFromBackend();

        // Listen for local updates if needed, but primarily relying on backend now.
        // We can still listen to 'onboarding-update' if other components trigger it.
        const handleEvent = () => loadFromBackend();
        window.addEventListener('onboarding-update', handleEvent);
        return () => window.removeEventListener('onboarding-update', handleEvent);
    }, [])

    const toggleItem = async (id: string) => {
        // Optimistic update
        const updated = items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        );
        setItems(updated);

        // Prepare data for backend
        const saveData = updated.reduce((acc, item) => ({
            ...acc,
            [item.id]: item.completed
        }), {});

        try {
            await api.auth.updateProfile({ onboarding_steps: saveData });
        } catch (e) {
            console.error('Failed to sync checklist to backend', e);
            // Revert on error? Or just silent fail.
        }
    }

    const completedCount = items.filter(i => i.completed).length
    const progress = (completedCount / items.length) * 100
    const allCompleted = completedCount === items.length

    if (loading) return null; // Or skeleton
    if (allCompleted) return null

    return (
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                        {allCompleted ? '🎉' : '🚀'} Primeiros Passos
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {allCompleted
                            ? 'Parabéns! Você completou o onboarding!'
                            : `Complete ${items.length - completedCount} ${items.length - completedCount === 1 ? 'tarefa' : 'tarefas'} para começar`
                        }
                    </p>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm text-primary hover:underline"
                >
                    {isExpanded ? 'Minimizar' : 'Expandir'}
                </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-foreground">{completedCount} de {items.length} completas</span>
                    <span className="font-bold text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Checklist Items */}
            {isExpanded && (
                <div className="space-y-3">
                    {items.map((item) => {
                        const Icon = item.icon
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50",
                                    item.completed
                                        ? "bg-primary/5 border-primary/30"
                                        : "bg-background border-border"
                                )}
                                onClick={() => {
                                    if (!item.completed) {
                                        if (item.onAction) {
                                            item.onAction()
                                        } else if (item.link) {
                                            window.location.href = item.link
                                        }
                                    }
                                }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleItem(item.id)
                                    }}
                                    className={cn(
                                        "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        item.completed
                                            ? "bg-primary border-primary"
                                            : "border-border hover:border-primary"
                                    )}
                                >
                                    {item.completed && <Check className="w-4 h-4 text-primary-foreground" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className={cn(
                                            "w-4 h-4",
                                            item.completed ? "text-primary" : "text-muted-foreground"
                                        )} />
                                        <h4 className={cn(
                                            "font-semibold text-sm",
                                            item.completed ? "text-primary line-through" : "text-foreground"
                                        )}>
                                            {item.title}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {allCompleted && (
                <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm font-medium text-primary">
                        🎊 Você está pronto para usar o ZapBroker!
                    </p>
                </div>
            )}
        </div>
    )
}
