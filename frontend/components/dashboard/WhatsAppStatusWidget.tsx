import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { Smartphone, AlertCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WhatsAppStatusWidget() {
    const [instanceStatus, setInstanceStatus] = useState<string>('disconnected')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Debounce initial call to avoid multiple simultaneous calls (React StrictMode)
        const timer = setTimeout(() => {
            fetchStatus()
        }, 1000)

        // Refresh status every 30 seconds
        const interval = setInterval(fetchStatus, 30000)

        return () => {
            clearTimeout(timer)
            clearInterval(interval)
        }
    }, [])

    const fetchStatus = async () => {
        try {
            setLoading(true)
            const instances = await api.instances.list().catch(() => [])
            const connectedInstance = instances.find((i: any) => i.status === 'connected' || i.status === 'open')

            if (connectedInstance) {
                setInstanceStatus('connected')

                // Update onboarding checklist automagically
                try {
                    const saved = localStorage.getItem('onboarding-checklist')
                    const savedData = saved ? JSON.parse(saved) : {}

                    if (!savedData['connect-whatsapp']) {
                        const newData = { ...savedData, 'connect-whatsapp': true }
                        localStorage.setItem('onboarding-checklist', JSON.stringify(newData))
                        window.dispatchEvent(new Event('onboarding-update'))
                    }
                } catch (e) {
                    console.error('Error updating onboarding status:', e)
                }

            } else {
                setInstanceStatus('disconnected')
            }
        } catch (error) {
            console.error('Error fetching WhatsApp status:', error)
            setInstanceStatus('error')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl p-6 shadow-lg animate-pulse">
                <div className="h-6 w-24 bg-white/20 rounded mb-4" />
                <div className="h-8 w-16 bg-white/20 rounded mb-2" />
                <div className="h-3 w-20 bg-white/20 rounded" />
            </div>
        )
    }

    const isConnected = instanceStatus === 'connected'

    return (
        <div className={cn(
            "rounded-xl p-6 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden group",
            isConnected
                ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white"
                : "bg-gradient-to-br from-rose-600 to-red-600 text-white animate-pulse"
        )}>
            {/* Animated background effect */}
            <div className={cn(
                "absolute inset-0 opacity-20",
                isConnected && "bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]"
            )} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                        "p-2.5 rounded-xl backdrop-blur-sm",
                        isConnected ? "bg-white/20" : "bg-white/30"
                    )}>
                        <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <span className={cn(
                        "text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5",
                        isConnected
                            ? "bg-white/30 text-white"
                            : "bg-white/40 text-white animate-bounce"
                    )}>
                        {isConnected ? (
                            <>
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                Online
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-3 h-3" />
                                Offline
                            </>
                        )}
                    </span>
                </div>

                <div className="text-3xl font-black mb-2 flex items-center gap-2">
                    {isConnected ? (
                        <>
                            <Zap className="w-7 h-7 animate-pulse" />
                            Ativo
                        </>
                    ) : (
                        <>
                            🔴
                            Inativo
                        </>
                    )}
                </div>

                <p className="text-sm text-white/90 font-medium mb-3">Status WhatsApp</p>

                {!isConnected && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-xs font-bold flex items-center gap-2 text-white">
                            <AlertCircle className="w-4 h-4" />
                            ⚠️ Conecte seu WhatsApp para enviar campanhas
                        </p>
                    </div>
                )}

                {isConnected && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-xs font-medium text-white/80">
                            ✅ Pronto para disparos
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
