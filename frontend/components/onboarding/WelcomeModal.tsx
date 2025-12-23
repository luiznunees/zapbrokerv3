import { useState, useEffect } from 'react'
import { X, Zap, Play } from 'lucide-react'

interface WelcomeModalProps {
    onClose: () => void
    onStartTour?: () => void
}

export function WelcomeModal({ onClose, onStartTour }: WelcomeModalProps) {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // Check if user has seen welcome modal
        const hasSeenWelcome = localStorage.getItem('has-seen-welcome')
        if (!hasSeenWelcome) {
            setShow(true)
        }
    }, [])

    const handleClose = () => {
        localStorage.setItem('has-seen-welcome', 'true')
        setShow(false)
        onClose()
    }

    const handleStartTour = () => {
        localStorage.setItem('has-seen-welcome', 'true')
        setShow(false)
        onStartTour?.()
    }

    if (!show) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Zap className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-3xl font-black text-foreground mb-3">
                        Bem-vindo ao ZapBroker! 🎉
                    </h1>

                    <p className="text-lg text-muted-foreground mb-6">
                        Sua plataforma completa para automação de WhatsApp
                    </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-accent/50 rounded-xl p-4">
                        <div className="text-2xl mb-2">📤</div>
                        <h3 className="font-bold text-sm mb-1">Campanhas em Massa</h3>
                        <p className="text-xs text-muted-foreground">
                            Envie milhares de mensagens personalizadas
                        </p>
                    </div>

                    <div className="bg-accent/50 rounded-xl p-4">
                        <div className="text-2xl mb-2">📊</div>
                        <h3 className="font-bold text-sm mb-1">Kanban de Leads</h3>
                        <p className="text-xs text-muted-foreground">
                            Gerencie seu funil de vendas visualmente
                        </p>
                    </div>

                    <div className="bg-accent/50 rounded-xl p-4">
                        <div className="text-2xl mb-2">🤖</div>
                        <h3 className="font-bold text-sm mb-1">AI Agent</h3>
                        <p className="text-xs text-muted-foreground">
                            Respostas automáticas inteligentes
                        </p>
                    </div>

                    <div className="bg-accent/50 rounded-xl p-4">
                        <div className="text-2xl mb-2">📈</div>
                        <h3 className="font-bold text-sm mb-1">Analytics</h3>
                        <p className="text-xs text-muted-foreground">
                            Acompanhe métricas em tempo real
                        </p>
                    </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleStartTour}
                        className="flex-1 bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        <Play className="w-5 h-5" />
                        Fazer Tour Guiado
                    </button>

                    <button
                        onClick={handleClose}
                        className="flex-1 bg-accent text-foreground py-4 rounded-xl font-bold hover:bg-accent/80 transition-all"
                    >
                        Explorar por Conta
                    </button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                    Você pode acessar o tour novamente a qualquer momento
                </p>
            </div>
        </div>
    )
}
