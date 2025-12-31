"use client"

import { useState } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function AdminInvitesPage() {
    const [planId, setPlanId] = useState('free')
    const [generatedLink, setGeneratedLink] = useState('')
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await api.admin.createInvite(planId)
            setGeneratedLink(res.link)
        } catch (error) {
            console.error('Failed to generate invite:', error)
            alert('Failed to generate invite')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pt-12">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-zinc-100 flex items-center justify-center gap-2">
                    <Sparkles className="text-yellow-500" />
                    Gerador de Convites
                </h1>
                <p className="text-zinc-400">Crie links de registro exclusivos para novos usuários.</p>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle className="text-zinc-100">Configurar Convite</CardTitle>
                    <CardDescription className="text-zinc-500">Escolha o plano que será atribuído ao usuário.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Plano Inicial</Label>
                        <Select value={planId} onValueChange={setPlanId}>
                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Freemium (Grátis)</SelectItem>
                                <SelectItem value="prod_ZxwseRQWbKLxHKsnfcUCMfYc">Básico</SelectItem>
                                <SelectItem value="prod_n6CMApuNhHqPCUrL2JmHyWbz">Plus</SelectItem>
                                <SelectItem value="prod_AXPStPBEeB5xrpubKyWB6EnY">Pro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12"
                    >
                        {loading ? 'Gerando...' : 'Gerar Link Único'}
                    </Button>

                    {generatedLink && (
                        <div className="animate-in fade-in slide-in-from-top-4 pt-4 border-t border-zinc-800">
                            <Label className="text-zinc-300 mb-2 block">Link Gerado (Expira em 24h)</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={generatedLink}
                                    readOnly
                                    className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-sm"
                                />
                                <Button
                                    onClick={copyToClipboard}
                                    className={copied ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
