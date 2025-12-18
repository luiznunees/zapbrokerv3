"use client"

import { useState } from 'react'

export default function NewCampaignPage() {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<null | { type: 'success' | 'error', msg: string }>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        const formData = new FormData(e.currentTarget)

        // Simulation
        setLoading(true)
        await new Promise(r => setTimeout(r, 1000))
        setLoading(false)
        setStatus({ type: 'success', msg: 'Campanha iniciada com sucesso! (Simulação)' })
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">Nova Campanha</h1>
                <p className="text-muted-foreground">Envie oportunidades para sua lista de contatos em massa.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Nome da Campanha</label>
                            <input name="name" type="text" placeholder="Ex: Lançamento Jardins" required className="w-full bg-background border border-border rounded-md px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Tipo de Mídia</label>
                            <select name="type" className="w-full bg-background border border-border rounded-md px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none">
                                <option value="text">Texto</option>
                                <option value="image">Imagem</option>
                                <option value="video">Vídeo</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Link da Mídia (Opcional)</label>
                        <input name="media_url" type="url" placeholder="https://..." className="w-full bg-background border border-border rounded-md px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
                        <textarea name="content" required rows={5} placeholder="Olá {nome}, tudo bem?..." className="w-full bg-background border border-border rounded-md px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"></textarea>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Contatos (CSV: Número,Nome)</label>
                        <textarea name="contacts" required rows={8} placeholder="5511999999999,João&#10;5521988888888,Maria" className="w-full bg-background border border-border rounded-md px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm placeholder:text-muted-foreground/50"></textarea>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-lg transition-colors flex justify-center shadow-lg shadow-primary/20">
                            {loading ? "Enviando..." : "🚀 Disparar Campanha"}
                        </button>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-lg text-center font-medium ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                            {status.msg}
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
