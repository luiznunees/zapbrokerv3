"use client"
import { useState } from 'react'
import { Bot, Mic, Save, Shield, MessageSquare, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AgentPage() {
    const [agentName, setAgentName] = useState("ZapBroker")
    const [voiceEnabled, setVoiceEnabled] = useState(true)
    const [permissions, setPermissions] = useState({
        readLeads: true,
        sendMessages: true,
        scheduleVisits: false
    })

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Bot className="w-8 h-8 text-primary" />
                    Seu Estagiário Digital
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Configure como sua IA atua no WhatsApp. Dê um nome e permissões.
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Visual Identity Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        Identidade
                    </h2>

                    <div>
                        <label className="block text-sm font-medium mb-2">Nome do Assistente</label>
                        <input
                            type="text"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            É assim que ele vai se apresentar (ex: "Sou o {agentName}, assistente do Anderson").
                        </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", voiceEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                <Mic className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium">Comandos de Voz</h3>
                                <p className="text-xs text-muted-foreground">Ouvir áudios que você envia</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={voiceEnabled} onChange={() => setVoiceEnabled(!voiceEnabled)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>

                {/* Permissions Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        Permissões
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        O que o {agentName} pode fazer sozinho?
                    </p>

                    <div className="space-y-4">
                        {[
                            { key: 'readLeads', label: 'Ler Base de Leads', desc: 'Acessar dados para filtrar contatos.', icon: MessageSquare },
                            { key: 'sendMessages', label: 'Disparar Mensagens', desc: 'Enviar campanhas ativas.', icon: Bot },
                            { key: 'scheduleVisits', label: 'Agendar Visitas (Beta)', desc: 'Sincronizar com seu Google Calendar.', icon: Bot }
                        ].map((perm: any) => (
                            <div key={perm.key} className="flex items-start gap-3 p-3 hover:bg-background rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={permissions[perm.key as keyof typeof permissions]}
                                    onChange={() => setPermissions({ ...permissions, [perm.key]: !permissions[perm.key as keyof typeof permissions] })}
                                    className="mt-1 rounded border-border text-primary focus:ring-primary/20 bg-background"
                                />
                                <div>
                                    <h3 className="font-medium text-sm text-foreground">{perm.label}</h3>
                                    <p className="text-xs text-muted-foreground">{perm.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                    <Save className="w-5 h-5" />
                    Salvar Estagiário
                </button>
            </div>
        </div>
    )
}
