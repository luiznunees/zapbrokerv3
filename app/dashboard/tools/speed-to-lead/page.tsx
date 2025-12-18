"use client"

import { useState } from 'react'
import { Zap, Clock, MessageCircle, Save, PlayCircle, Bot } from 'lucide-react'

export default function SpeedToLeadPage() {
    const [enabled, setEnabled] = useState(false)
    const [delay, setDelay] = useState("2")
    const [questions, setQuestions] = useState([
        "Qual seu orçamento aproximado para este investimento?",
        "Você busca imóvel para morar ou investir?",
        "Para quando você planeja a mudança?"
    ])
    const [simulating, setSimulating] = useState(false)

    // Simulation Chat Data
    const chatFlow = [
        { type: 'bot', text: `Olá! 👋 Vi que você se interessou pelo imóvel. Sou a assistente virtual do Anderson.`, delay: 0 },
        { type: 'bot', text: questions[0], delay: 1000 },
        { type: 'user', text: "Uns 800 mil.", delay: 2500 },
        { type: 'bot', text: questions[1], delay: 3500 },
        { type: 'user', text: "Morar mesmo.", delay: 5000 },
        { type: 'bot', text: "Entendido! Vou passar essas infos para o Anderson e ele já te chama. 😉", delay: 6000 }
    ]

    const [visibleMessages, setVisibleMessages] = useState<typeof chatFlow>([])

    function handleSimulate() {
        setSimulating(true)
        setVisibleMessages([])

        let totalDelay = 0
        chatFlow.forEach((msg, i) => {
            totalDelay += msg.delay || 1000
            setTimeout(() => {
                setVisibleMessages(prev => [...prev, msg])
                if (i === chatFlow.length - 1) setSimulating(false)
            }, totalDelay)
        })
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Zap className="text-primary" /> Speed-to-Lead (Atendimento Automático)
                </h1>
                <p className="text-muted-foreground">Responda seus leads em menos de 2 minutos e aumente sua conversão em 300%.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* CONFIGURATION */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-muted-foreground" /> Configuração do Robô
                    </h3>

                    <div className="space-y-6">
                        {/* Toggle */}
                        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border">
                            <div>
                                <span className="font-medium text-foreground block">Status do Robô</span>
                                <span className="text-xs text-muted-foreground">{enabled ? "Ativo e respondendo" : "Desativado"}</span>
                            </div>
                            <button
                                onClick={() => setEnabled(!enabled)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${enabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        {/* Delay */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Tempo de Resposta (Delay)
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {['0', '2', '5', '10'].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setDelay(m)}
                                        className={`py-2 px-3 rounded-md text-sm font-medium border transition-all ${delay === m ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-accent'}`}
                                    >
                                        {m === '0' ? 'Imediato' : `${m} min`}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                *Recomendamos <b>2 min</b> para parecer um humano digitando.
                            </p>
                        </div>

                        {/* Questions */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" /> Perguntas de Qualificação
                            </label>
                            <div className="space-y-3">
                                {questions.map((q, i) => (
                                    <input
                                        key={i}
                                        value={q}
                                        onChange={(e) => {
                                            const newQ = [...questions]
                                            newQ[i] = e.target.value
                                            setQuestions(newQ)
                                        }}
                                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                ))}
                            </div>
                        </div>

                        <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20">
                            <Save className="w-4 h-4" /> Salvar Configurações
                        </button>
                    </div>
                </div>

                {/* SIMULATOR */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Bot className="w-5 h-5 text-muted-foreground" /> Simulação (WhatsApp)
                        </h3>
                        <button
                            onClick={handleSimulate}
                            disabled={simulating}
                            className="text-xs flex items-center gap-1 bg-accent hover:bg-accent/80 px-3 py-1.5 rounded-md text-foreground transition-all disabled:opacity-50"
                        >
                            <PlayCircle className="w-3 h-3" /> {simulating ? "Digitando..." : "Testar Fluxo"}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-[#e5ddd5] dark:bg-[#0b141a] rounded-lg border border-border relative">
                        {/* Background Pattern Mock */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>

                        {visibleMessages.length === 0 && !simulating && (
                            <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm opacity-60">
                                Clique em "Testar Fluxo" para ver o robô em ação.
                            </div>
                        )}

                        {visibleMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.type === 'bot' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[80%] rounded-lg p-3 text-sm shadow-sm relative ${msg.type === 'bot' ? 'bg-white dark:bg-[#1f2c34] text-gray-900 dark:text-gray-100 rounded-tl-none' : 'bg-[#dcf8c6] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-tr-none'}`}>
                                    {msg.text}
                                    <span className={`block text-[10px] text-right mt-1 opacity-60`}>10:0{i}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function SettingsIcon(props: any) {
    return <Save {...props} /> // Fallback icon or import Settings
}
