"use client"

import { useState } from 'react'
import { Ghost, Send, AlertCircle, CheckCircle } from 'lucide-react'

export default function AntiGhostingPage() {
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [stats, setStats] = useState<null | { sent: number, recovered: number }>(null)

    const scripts = {
        breakup: `Oi {nome}, como não tivemos mais retorno, estou encerrando seu atendimento por aqui para dar prioridade a outros clientes.\n\nCaso volte a procurar imóvel, estou à disposição. Um abraço!`,
        doubt: `Oi {nome}, fiquei com uma dúvida: O que faltou para fecharmos negócio naquele imóvel? Foi o preço, a localização ou o momento não é o ideal? \n\nSua resposta é muito importante pra mim.`,
        pivot: `Oi {nome}, aquele imóvel que você gostou acabou de receber uma proposta.\n\nMas entrou um NOVO em {bairro} que é a sua cara. Quer ver as fotos antes de eu anunciar?`
    }

    const [selectedScript, setSelectedScript] = useState<keyof typeof scripts>('breakup')

    async function handleBlast(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setStats(null)
        setProgress(0)

        // Simulation
        for (let i = 0; i <= 100; i += 10) {
            setProgress(i)
            await new Promise(r => setTimeout(r, 200))
        }

        setLoading(false)
        setStats({
            sent: 42, // Mocked
            recovered: 8 // Mocked: 19% conversion rate simulation
        })
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Ghost className="text-primary" /> Protocolo Anti-Ghosting
                </h1>
                <p className="text-muted-foreground">Recupere leads que pararam de responder com gatilhos psicológicos.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* CONFIGURATION */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <form onSubmit={handleBlast} className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">1. Cole a lista de Leads (Frios)</label>
                            <textarea
                                className="w-full bg-background border border-border rounded-md p-3 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"
                                rows={6}
                                placeholder="João, 11999999999&#10;Maria, 11988888888&#10;..."
                                defaultValue="ListaExemplo_42_Leads.csv"
                            ></textarea>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Recomendado para leads sem resposta há +7 dias.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">2. Escolha a Estratégia</label>
                            <div className="space-y-3">
                                <label className={`block p-4 rounded-lg border cursor-pointer transition-all ${selectedScript === 'breakup' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="script" value="breakup" checked={selectedScript === 'breakup'} onChange={() => setSelectedScript('breakup')} className="text-primary focus:ring-primary" />
                                        <div>
                                            <span className="font-semibold text-foreground block">💔 The Break-up (O Término)</span>
                                            <span className="text-xs text-muted-foreground">Gatilho da Perda (Loss Aversion). Maior taxa de retorno.</span>
                                        </div>
                                    </div>
                                </label>

                                <label className={`block p-4 rounded-lg border cursor-pointer transition-all ${selectedScript === 'doubt' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="script" value="doubt" checked={selectedScript === 'doubt'} onChange={() => setSelectedScript('doubt')} className="text-primary focus:ring-primary" />
                                        <div>
                                            <span className="font-semibold text-foreground block">🤔 A Dúvida Sincera</span>
                                            <span className="text-xs text-muted-foreground">Pede feedback genuíno. Ótimo para entender objeções.</span>
                                        </div>
                                    </div>
                                </label>

                                <label className={`block p-4 rounded-lg border cursor-pointer transition-all ${selectedScript === 'pivot' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="script" value="pivot" checked={selectedScript === 'pivot'} onChange={() => setSelectedScript('pivot')} className="text-primary focus:ring-primary" />
                                        <div>
                                            <span className="font-semibold text-foreground block">🔄 O Pivô (Novidade)</span>
                                            <span className="text-xs text-muted-foreground">Oferece algo novo para reengajar.</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-destructive/90 hover:bg-destructive text-destructive-foreground font-semibold py-4 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg">
                            {loading ? "Ressuscitando..." : "👻 Iniciar Protocolo"}
                        </button>
                    </form>
                </div>

                {/* PREVIEW & STATS */}
                <div className="space-y-6">
                    <div className="bg-muted/30 border border-border rounded-xl p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Preview da Mensagem</h3>
                        <div className="bg-[#DCF8C6] dark:bg-[#056162] p-4 rounded-lg rounded-tl-none shadow-sm max-w-[85%] text-sm text-gray-900 dark:text-gray-100 relative">
                            {scripts[selectedScript]}
                            <span className="absolute bottom-1 right-2 text-[10px] text-gray-500 dark:text-gray-300">16:42</span>
                        </div>
                    </div>

                    {loading && (
                        <div className="bg-card border border-border rounded-xl p-6 text-center animate-pulse">
                            <h3 className="font-semibold text-foreground mb-2">Enviando para Lista...</h3>
                            <div className="w-full bg-muted rounded-full h-2.5 dark:bg-muted">
                                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{progress}% concluído</p>
                        </div>
                    )}

                    {stats && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center animate-in zoom-in duration-300">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-foreground mb-1">Protocolo Finalizado!</h3>
                            <div className="flex justify-center gap-8 mt-6">
                                <div>
                                    <span className="block text-3xl font-bold text-foreground">{stats.sent}</span>
                                    <span className="text-xs text-muted-foreground uppercase">Enviados</span>
                                </div>
                                <div className="w-px bg-border"></div>
                                <div>
                                    <span className="block text-3xl font-bold text-emerald-500">{stats.recovered}</span>
                                    <span className="text-xs text-emerald-500 font-bold uppercase">Ressuscitados (19%)</span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-6">
                                8 pessoas responderam sua mensagem. <br />
                                <a href="#" className="text-primary hover:underline">Ir para o Inbox ver respostas →</a>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
