"use client"

import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Copy, Check, Sparkles, Ban, ListChecks } from 'lucide-react'
import { Input } from '@/components/ui/input'

const TRIAL_DAYS = 15

type Invite = {
    id: string
    code: string
    link: string
    plan_id: string
    trial_days: number | null
    email: string | null
    max_uses: number
    uses_count: number
    revoked: boolean
    created_at: string
}

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

    const [invites, setInvites] = useState<Invite[]>([])
    const [loadingInvites, setLoadingInvites] = useState(true)
    const [revokingId, setRevokingId] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const loadInvites = async () => {
        setLoadingInvites(true)
        try {
            const data = await api.admin.listInvites()
            setInvites(data)
        } catch (error) {
            console.error('Failed to load invites:', error)
        } finally {
            setLoadingInvites(false)
        }
    }

    useEffect(() => {
        loadInvites()
    }, [])

    const handleRevoke = async (invite: Invite) => {
        if (!confirm(`Revogar o convite ${invite.code}? Ele para de funcionar na hora, mesmo com vagas sobrando.`)) return
        setRevokingId(invite.id)
        try {
            await api.admin.revokeInvite(invite.id)
            await loadInvites()
        } catch (error) {
            console.error('Failed to revoke invite:', error)
            alert('Falha ao revogar convite')
        } finally {
            setRevokingId(null)
        }
    }

    const copyInviteLink = (invite: Invite) => {
        navigator.clipboard.writeText(invite.link)
        setCopiedId(invite.id)
        setTimeout(() => setCopiedId(null), 2000)
    }

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
            await loadInvites()
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

    const totalInvites = invites.length
    const activeInvites = invites.filter((i) => !i.revoked && i.uses_count < i.max_uses).length
    const totalUsed = invites.reduce((sum, i) => sum + i.uses_count, 0)

    return (
        <div className="max-w-4xl mx-auto space-y-8 pt-12">
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 shrink-0">
                    <Sparkles className="size-5 text-primary" />
                </div>
                <div>
                    <h1 className="font-display text-3xl font-extrabold text-zinc-100 tracking-tight">Convites</h1>
                    <p className="text-zinc-400 text-sm">Crie e acompanhe links de registro pra novos usuários.</p>
                </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 rounded-3xl border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle className="font-display font-bold text-zinc-100">Configurar Convite</CardTitle>
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
                        className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold h-12"
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
                                    className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-sm rounded-xl"
                                />
                                <Button
                                    onClick={copyToClipboard}
                                    className={`rounded-full shrink-0 ${copied ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 rounded-3xl">
                <CardHeader>
                    <CardTitle className="font-display font-bold text-zinc-100 flex items-center gap-2">
                        <ListChecks className="size-4 text-primary" />
                        Convites gerados
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Últimos 100 convites, mais recente primeiro. Revogar encerra o link na hora, mesmo com vagas sobrando.
                    </CardDescription>
                    {totalInvites > 0 && (
                        <div className="flex gap-3 pt-2">
                            <div className="flex-1 rounded-2xl bg-zinc-950 border border-zinc-800 px-4 py-3">
                                <p className="text-xs text-zinc-500">Total</p>
                                <p className="font-display text-xl font-extrabold text-zinc-100">{totalInvites}</p>
                            </div>
                            <div className="flex-1 rounded-2xl bg-zinc-950 border border-zinc-800 px-4 py-3">
                                <p className="text-xs text-zinc-500">Ativos</p>
                                <p className="font-display text-xl font-extrabold text-primary">{activeInvites}</p>
                            </div>
                            <div className="flex-1 rounded-2xl bg-zinc-950 border border-zinc-800 px-4 py-3">
                                <p className="text-xs text-zinc-500">Vagas usadas</p>
                                <p className="font-display text-xl font-extrabold text-zinc-100">{totalUsed}</p>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {loadingInvites ? (
                        <p className="text-sm text-zinc-500">Carregando...</p>
                    ) : invites.length === 0 ? (
                        <p className="text-sm text-zinc-500">Nenhum convite gerado ainda.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-transparent">
                                    <TableHead className="text-zinc-400">Código</TableHead>
                                    <TableHead className="text-zinc-400">Plano</TableHead>
                                    <TableHead className="text-zinc-400">Vagas</TableHead>
                                    <TableHead className="text-zinc-400">Dias</TableHead>
                                    <TableHead className="text-zinc-400">Email</TableHead>
                                    <TableHead className="text-zinc-400">Criado em</TableHead>
                                    <TableHead className="text-zinc-400">Status</TableHead>
                                    <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invites.map((invite) => {
                                    const exhausted = invite.uses_count >= invite.max_uses
                                    const status = invite.revoked ? 'revoked' : exhausted ? 'exhausted' : 'active'
                                    return (
                                        <TableRow key={invite.id} className="border-zinc-800">
                                            <TableCell className="font-mono text-zinc-300">{invite.code}</TableCell>
                                            <TableCell className="text-zinc-300">{invite.plan_id}</TableCell>
                                            <TableCell className="text-zinc-300">{invite.uses_count}/{invite.max_uses}</TableCell>
                                            <TableCell className="text-zinc-300">{invite.trial_days ? `${invite.trial_days}d` : '—'}</TableCell>
                                            <TableCell className="text-zinc-300 max-w-[160px] truncate">{invite.email || '—'}</TableCell>
                                            <TableCell className="text-zinc-500 text-xs">
                                                {new Date(invite.created_at).toLocaleString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                {status === 'active' && <Badge className="rounded-full bg-primary/10 text-primary border-primary/20">Ativo</Badge>}
                                                {status === 'exhausted' && <Badge className="rounded-full bg-zinc-700/50 text-zinc-400 border-zinc-700">Esgotado</Badge>}
                                                {status === 'revoked' && <Badge className="rounded-full bg-red-500/10 text-red-500 border-red-500/20">Revogado</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right space-x-1.5">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-primary size-8"
                                                    onClick={() => copyInviteLink(invite)}
                                                >
                                                    {copiedId === invite.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                </Button>
                                                {status === 'active' && (
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="rounded-full border-zinc-700 text-red-400 hover:bg-red-500/10 hover:text-red-400 size-8"
                                                        disabled={revokingId === invite.id}
                                                        onClick={() => handleRevoke(invite)}
                                                    >
                                                        <Ban className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
