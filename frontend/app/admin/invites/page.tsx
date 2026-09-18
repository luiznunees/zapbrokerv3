"use client"

import { useState } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'

const TRIAL_DAYS = 15

export default function AdminInvitesPage() {
    const [mode, setMode] = useState<'personal' | 'shared'>('personal')
    const [planId, setPlanId] = useState('trial')
    const [email, setEmail] = useState('')
    const [maxUses, setMaxUses] = useState('10')
    const [sharedPlanId, setSharedPlanId] = useState('pro')
    const [sharedTrialDays, setSharedTrialDays] = useState('3')
    const [generatedLink, setGeneratedLink] = useState('')
    const [generatedIsTrial, setGeneratedIsTrial] = useState(false)
    const [generatedEmail, setGeneratedEmail] = useState('')
    const [generatedMaxUses, setGeneratedMaxUses] = useState(1)
    const [generatedTrialDays, setGeneratedTrialDays] = useState(TRIAL_DAYS)
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)

    const isTrial = planId === 'trial'
    const isShared = mode === 'shared'
    const emailValid = /\S+@\S+\.\S+/.test(email.trim())
    const maxUsesValid = Number(maxUses) >= 2 && Number.isInteger(Number(maxUses))
    const sharedTrialDaysNum = Number(sharedTrialDays)
    const canGenerate = isShared ? maxUsesValid : emailValid

    const handleGenerate = async () => {
        if (!canGenerate) return
        setLoading(true)
        try {
            const res = await api.admin.createInvite(
                isShared ? sharedPlanId : (isTrial ? 'pro' : planId),
                isShared ? (sharedTrialDaysNum > 0 ? sharedTrialDaysNum : undefined) : (isTrial ? TRIAL_DAYS : undefined),
                isShared ? undefined : email.trim(),
                isShared ? Number(maxUses) : 1,
            )
            setGeneratedLink(res.link)
            setGeneratedIsTrial(isShared ? sharedTrialDaysNum > 0 : isTrial)
            setGeneratedEmail(isShared ? '' : email.trim())
            setGeneratedMaxUses(isShared ? Number(maxUses) : 1)
            setGeneratedTrialDays(isShared ? sharedTrialDaysNum : TRIAL_DAYS)
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
                        <Label className="text-zinc-300">Tipo de convite</Label>
                        <Select value={mode} onValueChange={(v) => setMode(v as 'personal' | 'shared')}>
                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Pessoal — 1 uso, travado a um email</SelectItem>
                                <SelectItem value="shared">Compartilhável — 1 link, várias vagas (ex: fórum/comunidade)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isShared ? (
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Número de vagas</Label>
                            <Input
                                type="number"
                                min={2}
                                step={1}
                                value={maxUses}
                                onChange={(e) => setMaxUses(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                            />
                            <p className="text-xs text-zinc-500">
                                Mesmo link pra todo mundo, sem email travado. Assim que o número de cadastros
                                bater nesse limite, o link para de funcionar pros próximos — mesmo se caírem
                                juntos ao mesmo tempo.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Email da pessoa</Label>
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="pessoa@email.com"
                                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                            />
                            <p className="text-xs text-zinc-500">
                                O convite fica travado nesse email — só funciona se a pessoa se cadastrar com ele.
                            </p>
                        </div>
                    )}

                    {isShared ? (
                        <>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Plano Inicial</Label>
                                <Select value={sharedPlanId} onValueChange={setSharedPlanId}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                        <SelectValue placeholder="Selecione o plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Freemium</SelectItem>
                                        <SelectItem value="starter">Starter</SelectItem>
                                        <SelectItem value="pro">Pro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Dias de acesso</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={sharedTrialDays}
                                    onChange={(e) => setSharedTrialDays(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                />
                                <p className="text-xs text-zinc-500">
                                    {sharedTrialDaysNum > 0
                                        ? `Cada conta criada por esse link expira sozinha ${sharedTrialDaysNum} dias depois do cadastro, sem cobrança.`
                                        : 'Deixe 0 pra acesso permanente (sem expirar), sem cobrança.'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Plano Inicial</Label>
                            <Select value={planId} onValueChange={setPlanId}>
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                    <SelectValue placeholder="Selecione o plano" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trial">Teste grátis — {TRIAL_DAYS} dias (Pro)</SelectItem>
                                    <SelectItem value="free">Freemium (Grátis, sem prazo)</SelectItem>
                                    <SelectItem value="starter">Starter (sem prazo)</SelectItem>
                                    <SelectItem value="pro">Pro (sem prazo)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-zinc-500">
                                {isTrial
                                    ? `Acesso completo ao plano Pro por ${TRIAL_DAYS} dias. Expira automaticamente depois disso, sem cobrança.`
                                    : 'Acesso permanente ao plano escolhido, sem cobrança — pra convidados fixos.'}
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !canGenerate}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12"
                    >
                        {loading ? 'Gerando...' : isShared ? 'Gerar Link Compartilhável' : 'Gerar Link Único'}
                    </Button>

                    {generatedLink && (
                        <div className="animate-in fade-in slide-in-from-top-4 pt-4 border-t border-zinc-800">
                            <Label className="text-zinc-300 mb-2 block">
                                {generatedMaxUses > 1
                                    ? <>Link compartilhável — válido para <span className="text-primary">{generatedMaxUses} cadastros</span></>
                                    : <>Link gerado pra <span className="text-primary">{generatedEmail}</span> — uso único</>
                                }
                                {generatedIsTrial ? ` (${generatedTrialDays} dias de teste grátis)` : ''}
                            </Label>
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
