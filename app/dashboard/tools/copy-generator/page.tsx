"use client"

import { useState } from 'react'
import { Sparkles, Copy, Check } from 'lucide-react'

export default function CopyGeneratorPage() {
    const [loading, setLoading] = useState(false)
    const [generatedCopy, setGeneratedCopy] = useState("")
    const [copied, setCopied] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setGeneratedCopy("")

        const formData = new FormData(e.currentTarget)
        const data = {
            type: formData.get('type') as string,
            location: formData.get('location') as string,
            price: formData.get('price') as string,
            features: formData.get('features') as string,
            tone: formData.get('tone') as string
        }

        // Simulating AI Generation Delay
        await new Promise(r => setTimeout(r, 1500))

        // Template Logic (Mock AI)
        const templates: Record<string, string> = {
            urgent: `🔥 *OPORTUNIDADE RELÂMPAGO EM {LOCATION}*\n\n{TYPE} disponível agora por apenas {PRICE}!\n\nDestaques:\n✅ {FEATURES}\n\n⚠️ O proprietário precisa vender HOJE. Não vai durar.\n\n👇 Me chama agora pra visitar:\n[Seu Link WhatsApp]`,
            exclusive: `💎 *VIVER BEM NO {LOCATION}*\n\nConheça este {TYPE} exclusivo. O padrão que você e sua família merecem.\n\n✨ {FEATURES}\n💰 Investimento: {PRICE}\n\n🤫 Atendimento sigiloso e exclusivo.\n\nAgende sua visita privada:`,
            investor: `📈 *ALERTA DE INVESTIDOR - {LOCATION}*\n\n{TYPE} abaixo do valor de mercado. ROI garantido.\n\nPreço: {PRICE}\nPotencial: {FEATURES}\n\nIdeal para renda passiva ou flip.\n\n📲 Me chama pra ver a planilha de rentabilidade.`
        }

        let copy = templates[data.tone] || templates['urgent']
        copy = copy.replace('{LOCATION}', data.location.toUpperCase())
        copy = copy.replace('{TYPE}', data.type)
        copy = copy.replace('{PRICE}', data.price)
        copy = copy.replace('{FEATURES}', data.features.split(',').map(f => f.trim()).join('\n✅ '))

        setGeneratedCopy(copy)
        setLoading(false)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="text-primary" /> Gerador de Copy (IA)
                </h1>
                <p className="text-muted-foreground">Transforme dados técnicos em mensagens irresistíveis de venda.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* FORM */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Tipo de Imóvel</label>
                            <select name="type" className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none">
                                <option value="Apartamento">Apartamento</option>
                                <option value="Casa de Condomínio">Casa de Condomínio</option>
                                <option value="Cobertura">Cobertura</option>
                                <option value="Lote/Terreno">Lote/Terreno</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Localização (Bairro)</label>
                            <input name="location" type="text" placeholder="Ex: Jardins" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Preço</label>
                            <input name="price" type="text" placeholder="Ex: R$ 850.000" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Destaques (separados por vírgula)</label>
                            <textarea name="features" rows={3} placeholder="Ex: Vista livre, 3 suítes, Varanda Gourmet" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"></textarea>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Tom de Voz</label>
                            <div className="grid grid-cols-3 gap-2">
                                <label className="cursor-pointer">
                                    <input type="radio" name="tone" value="urgent" className="peer sr-only" defaultChecked />
                                    <div className="text-center p-2 rounded-md border border-border peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary transition-all">
                                        🔥 Urgente
                                    </div>
                                </label>
                                <label className="cursor-pointer">
                                    <input type="radio" name="tone" value="exclusive" className="peer sr-only" />
                                    <div className="text-center p-2 rounded-md border border-border peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary transition-all">
                                        💎 Luxo
                                    </div>
                                </label>
                                <label className="cursor-pointer">
                                    <input type="radio" name="tone" value="investor" className="peer sr-only" />
                                    <div className="text-center p-2 rounded-md border border-border peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary transition-all">
                                        📈 Investidor
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20 mt-4">
                            {loading ? <Sparkles className="animate-spin w-5 h-5" /> : <><Sparkles className="w-5 h-5" /> Gerar Copy Mágica</>}
                        </button>
                    </form>
                </div>

                {/* OUTPUT */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative h-fit">
                    <h3 className="font-semibold text-foreground mb-4">Resultado:</h3>

                    {generatedCopy ? (
                        <div className="animate-in fade-in zoom-in duration-300">
                            <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap text-muted-foreground border border-border">
                                {generatedCopy}
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="absolute top-6 right-6 p-2 bg-background border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all"
                                title="Copiar"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-border rounded-lg">
                            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                            <p>Preencha o formulário para gerar...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
