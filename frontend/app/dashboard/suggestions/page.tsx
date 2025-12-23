"use client"

import { Lightbulb, Send, CheckCircle2 } from "lucide-react"
import { useState } from "react"

export default function SuggestionsPage() {
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setLoading(false)
        setSent(true)
    }

    if (sent) {
        return (
            <div className="p-6 max-w-2xl mx-auto h-[60vh] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Sugestão Enviada!</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                    Obrigado por contribuir. Analisaremos sua ideia com carinho e se for viável, entraremos em contato.
                </p>
                <button
                    onClick={() => {
                        setSent(false)
                        // Reset form logic would go here
                    }}
                    className="px-6 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors"
                >
                    Enviar outra sugestão
                </button>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-8">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-xl">
                    <Lightbulb className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Caixa de Sugestões</h1>
                    <p className="text-muted-foreground mt-1">
                        Tem uma ideia para melhorar o ZapBroker? Conte para nós! As melhores sugestões entram no nosso roadmap.
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Assunto</label>
                        <select className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                            <option>Nova Funcionalidade</option>
                            <option>Melhoria de Interface</option>
                            <option>Reportar Bug</option>
                            <option>Outro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Sua Sugestão</label>
                        <textarea
                            required
                            placeholder="Descreva sua ideia em detalhes..."
                            rows={6}
                            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-70"
                        >
                            {loading ? (
                                "Enviando..."
                            ) : (
                                <>
                                    <Send className="w-4 h-4" /> Enviar Sugestão
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
