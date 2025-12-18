"use client"
import { useState } from 'react'
import { User, Smartphone, CreditCard, QrCode, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'connection' | 'plan'>('connection')
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)

    const handleConnect = () => {
        setConnecting(true)
        setTimeout(() => {
            setConnecting(false)
            setConnected(true)
        }, 3000)
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

            <div className="flex gap-2 mb-8 border-b border-border">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={cn(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                        activeTab === 'profile' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <User className="w-4 h-4" /> Perfil
                </button>
                <button
                    onClick={() => setActiveTab('connection')}
                    className={cn(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                        activeTab === 'connection' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Smartphone className="w-4 h-4" /> Conexão WhatsApp
                </button>
                <button
                    onClick={() => setActiveTab('plan')}
                    className={cn(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                        activeTab === 'plan' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <CreditCard className="w-4 h-4" /> Assinatura
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                {activeTab === 'profile' && (
                    <div className="space-y-6 max-w-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl font-bold">AS</div>
                            <button className="text-sm text-primary hover:underline">Alterar foto</button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome Completo</label>
                            <input type="text" defaultValue="Anderson Silveira" className="w-full px-4 py-2 rounded-lg bg-background border border-border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" defaultValue="anderson@example.com" disabled className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-muted-foreground cursor-not-allowed" />
                        </div>
                        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium">Salvar Alterações</button>
                    </div>
                )}

                {activeTab === 'connection' && (
                    <div className="text-center py-8">
                        {connected ? (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in">
                                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">WhatsApp Conectado!</h3>
                                <p className="text-muted-foreground mb-6">Número: (51) 98098-5330</p>
                                <button onClick={() => setConnected(false)} className="text-red-500 hover:underline text-sm font-medium">Desconectar</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <h3 className="text-xl font-bold mb-2">Conecte seu WhatsApp</h3>
                                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código abaixo.</p>

                                <div className="relative group cursor-pointer" onClick={handleConnect}>
                                    <div className={`w-64 h-64 bg-white p-4 rounded-xl border border-border mx-auto transition-all ${connecting ? 'blur-sm opacity-50' : ''}`}>
                                        {/* Fake QR Code Pattern */}
                                        <div className="w-full h-full bg-black pattern-grid-lg opacity-80" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                                        <QrCode className="absolute inset-0 m-auto w-16 h-16 text-black" />
                                    </div>

                                    {connecting && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-background/80 backdrop-blur-md px-6 py-4 rounded-xl border border-border shadow-2xl flex flex-col items-center">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                                                <span className="font-bold">Conectando...</span>
                                            </div>
                                        </div>
                                    )}

                                    {!connecting && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm rounded-xl">
                                            <span className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold shadow-lg">Clique para Simular</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center p-6 border border-primary/20 bg-primary/5 rounded-xl">
                            <div>
                                <h3 className="font-bold text-lg text-primary">Plano Top Producer</h3>
                                <p className="text-muted-foreground">Você tem acesso a todos os recursos.</p>
                            </div>
                            <span className="px-4 py-1 bg-primary text-primary-foreground rounded-full text-sm font-bold">Ativo</span>
                        </div>
                        <div className="text-right">
                            <button className="text-sm text-muted-foreground hover:text-foreground underline">Gerenciar Pagamento (Stripe)</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
