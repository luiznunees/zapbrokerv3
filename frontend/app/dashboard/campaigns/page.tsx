"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Rocket,
    Users,
    Clock,
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    Layers,
    ArrowRight,
    ArrowLeft,
    Plus,
    Trash2,
    Image as ImageIcon,
    Video,
    FileText,
    Zap,
    Info,
    Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { AntiBanWarningModal } from '@/components/modals/AntiBanWarningModal'

interface ContactList {
    id: string
    name: string
    total_contacts: number
    tags: string[]
}

interface WhatsAppInstance {
    id: string
    name: string
    status: string
    phone_number: string
}

export default function CampaignsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [instances, setInstances] = useState<WhatsAppInstance[]>([])
    const [contactLists, setContactLists] = useState<ContactList[]>([])
    const [currentStep, setCurrentStep] = useState(1)
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
    const [showAntiBanModal, setShowAntiBanModal] = useState(false)

    // Campaign Form Data
    const [formData, setFormData] = useState({
        name: '',
        instanceId: '',
        messageType: 'text' as 'text' | 'image' | 'video' | 'audio' | 'document',
        contactListId: '',
        scheduledAt: '',
        minDelay: 15,
        maxDelay: 45,
        batchSize: 50,
        batchDelay: 300,
        sequentialMode: false,
        sequentialBlockDelay: 10,
    })

    const [messageVariations, setMessageVariations] = useState<string[]>([''])
    const [mediaFile, setMediaFile] = useState<File | null>(null)

    // Load initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [instancesRes, listsRes] = await Promise.all([
                    api.get('/whatsapp/instances'),
                    api.get('/contacts/lists')
                ])
                setInstances(instancesRes.data.filter((i: WhatsAppInstance) => i.status === 'connected'))
                setContactLists(listsRes.data)
            } catch (error) {
                console.error('Error loading data:', error)
                setStatus({
                    type: 'error',
                    msg: 'Erro ao carregar dados iniciais. Verifique sua conexão e recarregue a página.'
                })
            }
        }
        fetchData()
    }, [])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setMediaFile(e.target.files[0])
        }
    }

    const addVariation = () => {
        setMessageVariations([...messageVariations, ''])
    }

    const removeVariation = (index: number) => {
        if (messageVariations.length > 1) {
            const newVariations = messageVariations.filter((_, i) => i !== index)
            setMessageVariations(newVariations)
        }
    }

    const updateVariation = (index: number, value: string) => {
        const newVariations = [...messageVariations]
        newVariations[index] = value
        setMessageVariations(newVariations)
    }

    const nextStep = () => {
        if (currentStep < 6) setCurrentStep(currentStep + 1)
    }

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    const handleSubmit = async () => {
        setLoading(true)
        setStatus(null)

        try {
            // Validate required fields
            if (!formData.name || !formData.instanceId || !formData.contactListId) {
                throw new Error('Preencha todos os campos obrigatórios')
            }

            if (messageVariations.filter(m => m.trim()).length === 0) {
                throw new Error('Adicione pelo menos uma mensagem')
            }

            // Create FormData object for multipart/form-data submission
            const payload = new FormData()

            // Append basic fields
            Object.entries(formData).forEach(([key, value]) => {
                payload.append(key, String(value))
            })

            // Append messages
            payload.append('messages', JSON.stringify(messageVariations.filter(m => m.trim())))

            // Append media if exists
            if (mediaFile) {
                payload.append('media', mediaFile)
            }

            // Send to backend
            await api.post('/campaigns', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            setStatus({
                type: 'success',
                msg: 'Campanha criada e agendada com sucesso! O disparo começará em breve.'
            })

            // Show success for 2 seconds then redirect/reset
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)

        } catch (error: any) {
            console.error('Error creating campaign:', error)
            setStatus({
                type: 'error',
                msg: error.response?.data?.message || error.message || 'Erro ao criar campanha'
            })
            // If error is about quota, maybe show a specific modal or alert
        } finally {
            setLoading(false)
        }
    }

    // Helper to estimate risk based on delay
    const getRiskLevel = (min: number, max: number) => {
        const avg = (min + max) / 2
        if (avg < 10) return { label: 'Alto Risco 🚨', color: 'text-red-500', bg: 'bg-red-500/10' }
        if (avg < 30) return { label: 'Risco Médio ⚠️', color: 'text-amber-500', bg: 'bg-amber-500/10' }
        return { label: 'Baixo Risco ✅', color: 'text-green-500', bg: 'bg-green-500/10' }
    }

    const risk = getRiskLevel(formData.minDelay, formData.maxDelay)


    return (
        <div className="container mx-auto p-6 max-w-5xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Rocket className="w-8 h-8 text-primary" />
                        Nova Campanha
                    </h1>
                    <p className="text-muted-foreground mt-1">Configuração de disparo em massa seguro</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowAntiBanModal(true)}
                    className="gap-2"
                >
                    <Info className="w-4 h-4" /> Dicas Anti-Ban
                </Button>
            </div>

            {/* Stepper */}
            <div className="mb-8">
                <div className="flex justify-between relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-border -z-10 -translate-y-1/2" />

                    {/* Active Progress Bar */}
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                    />

                    {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div key={step} className="flex flex-col items-center gap-2 bg-background px-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold",
                                step === currentStep ? "border-primary bg-primary text-primary-foreground scale-110" :
                                    step < currentStep ? "border-primary bg-primary/20 text-primary" :
                                        "border-muted text-muted-foreground bg-card"
                            )}>
                                {step < currentStep ? <CheckCircle2 className="w-6 h-6" /> : step}
                            </div>
                            <span className={cn(
                                "text-xs font-medium hidden md:block",
                                step === currentStep ? "text-primary" : "text-muted-foreground"
                            )}>
                                {step === 1 && "Start"}
                                {step === 2 && "Conteúdo"}
                                {step === 3 && "Blocos"}
                                {step === 4 && "Timing"}
                                {step === 5 && "Lotes"}
                                {step === 6 && "Público"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden min-h-[400px] flex flex-col relative">

                {/* Status Message Overlay */}
                {status && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                        <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center mb-4 flow-step-icons",
                            status.type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                            {status.type === 'success' ? <Rocket className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{status.type === 'success' ? 'Sucesso!' : 'Algo deu errado'}</h3>
                        <p className="text-muted-foreground text-lg mb-6">{status.msg}</p>

                        {status.type === 'error' && (
                            <Button
                                onClick={() => setStatus(null)}
                                variant="destructive"
                                className="px-8"
                            >
                                Voltar e Corrigir
                            </Button>
                        )}
                    </div>
                )}

                {/* Step Content */}
                <div className="p-8 flex-1">

                    {/* STEP 1: NOME & INSTÂNCIA */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-base">Nome da Campanha</Label>
                                    <Input
                                        placeholder="Ex: Oferta Black Friday - Lista VIP"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="h-12 text-lg"
                                        autoFocus
                                    />
                                    <p className="text-sm text-muted-foreground">Apenas para sua organização interna.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base">Instância do WhatsApp</Label>
                                    <Select
                                        value={formData.instanceId}
                                        onValueChange={v => setFormData({ ...formData, instanceId: v })}
                                    >
                                        <SelectTrigger className="h-12 text-lg">
                                            <SelectValue placeholder="Selecione um número" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {instances.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-muted-foreground">
                                                    Nenhuma instância conectada.
                                                    <br />Vá em Configurações &gt; WhatsApp para conectar.
                                                </div>
                                            ) : (
                                                instances.map(inst => (
                                                    <SelectItem key={inst.id} value={inst.id} className="flex items-center gap-2">
                                                        <span className="flex items-center gap-2">
                                                            <Smartphone className="w-4 h-4 text-green-500" />
                                                            {inst.name} ({inst.phone_number})
                                                        </span>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label className="text-base">Tipo de Mensagem</Label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {[
                                        { id: 'text', label: 'Texto', icon: FileText },
                                        { id: 'image', label: 'Imagem', icon: ImageIcon },
                                        { id: 'video', label: 'Vídeo', icon: Video },
                                        { id: 'audio', label: 'Áudio', icon: MessageSquare },
                                        { id: 'document', label: 'Arquivo', icon: Layers },
                                    ].map(type => (
                                        <div
                                            key={type.id}
                                            onClick={() => setFormData({ ...formData, messageType: type.id as any })}
                                            className={cn(
                                                "cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all hover:bg-accent",
                                                formData.messageType === type.id ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-border"
                                            )}
                                        >
                                            <type.icon className="w-6 h-6" />
                                            <span className="font-medium">{type.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: VARIAÇÕES & MÍDIA */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">

                            {/* Media Upload */}
                            {formData.messageType !== 'text' && (
                                <div className="bg-accent/30 p-6 rounded-xl border border-dashed border-primary/50 text-center">
                                    <Label className="cursor-pointer block">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                            {mediaFile ? <CheckCircle2 className="w-8 h-8" /> : <Layers className="w-8 h-8" />}
                                        </div>
                                        <span className="text-lg font-medium block">
                                            {mediaFile ? mediaFile.name : `Clique para fazer upload de ${formData.messageType}`}
                                        </span>
                                        <span className="text-sm text-muted-foreground block mt-1">
                                            {mediaFile ? 'Arquivo selecionado' : 'Formatos suportados: JPG, PNG, MP4, MP3, PDF'}
                                        </span>
                                        <Input
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            accept={
                                                formData.messageType === 'image' ? 'image/*' :
                                                    formData.messageType === 'video' ? 'video/*' :
                                                        formData.messageType === 'audio' ? 'audio/*' :
                                                            '*/*'
                                            }
                                        />
                                    </Label>
                                </div>
                            )}

                            {/* Message Variations */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-base">Mensagens (Spintax / Variações)</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="w-4 h-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    Adicione múltiplas versões da sua mensagem. O sistema irá rotacionar entre elas para simular comportamento humano e reduzir risco de bloqueio.
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Badge variant="secondary" className="gap-1">
                                        <Layers className="w-3 h-3" />
                                        {messageVariations.length} Variações
                                    </Badge>
                                </div>

                                <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
                                    {messageVariations.map((msg, idx) => (
                                        <div key={idx} className="relative group">
                                            <div className="absolute top-3 left-3 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                                {idx + 1}
                                            </div>
                                            <Textarea
                                                placeholder={`Escreva a variação ${idx + 1} da sua mensagem...`}
                                                value={msg}
                                                onChange={(e) => updateVariation(idx, e.target.value)}
                                                className="min-h-[120px] pl-12 resize-none text-base"
                                            />
                                            {messageVariations.length > 1 && (
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeVariation(idx)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={addVariation}
                                    className="w-full h-12 border-dashed gap-2 hover:border-primary hover:text-primary"
                                >
                                    <Plus className="w-4 h-4" /> Adicionar Nova Variação
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: MODO SEQUENCIAL */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="flex items-center justify-between p-6 bg-accent/20 border border-border rounded-xl">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-primary" />
                                        Modo Mensagem Sequencial
                                    </h3>
                                    <p className="text-muted-foreground max-w-lg">
                                        Envia múltiplas mensagens curtas em sequência para o mesmo contato (ex: "Oi" ...digita... "Tudo bem?"), simulando uma conversa real.
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.sequentialMode}
                                    onCheckedChange={c => setFormData({ ...formData, sequentialMode: c })}
                                    className="scale-150"
                                />
                            </div>

                            {formData.sequentialMode && (
                                <div className="p-6 bg-accent/10 rounded-xl border border-dashed border-primary/30 space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center gap-2 text-primary font-medium">
                                        <Clock className="w-5 h-5" /> Configuração do Delay entre Blocos
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Tempo de espera simulando "digitando..." entre uma mensagem e outra para o mesmo contato.
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={formData.sequentialBlockDelay}
                                            onChange={e => setFormData({ ...formData, sequentialBlockDelay: Number(e.target.value) })}
                                            className="w-32 text-center text-lg font-bold"
                                        />
                                        <span className="text-muted-foreground font-medium">segundos (média)</span>
                                    </div>

                                    <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-700">
                                        <Info className="w-4 h-4" />
                                        <AlertTitle>Dica de Uso</AlertTitle>
                                        <AlertDescription>
                                            No passo anterior, cada "Variação" será tratada como um bloco. Se você adicionar 3 variações e ativar este modo, o contato receberá as 3 mensagens em sequência.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: TIMING (DELAY) */}
                    {currentStep === 4 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="text-center space-y-2 mb-8">
                                <h3 className="text-xl font-bold">Comportamento de Envio</h3>
                                <p className="text-muted-foreground">Defina o intervalo aleatório entre cada contato para evitar detecção de spam.</p>
                            </div>

                            <Card className={cn("border-2 transition-all", risk.color.replace('text-', 'border-'))}>
                                <CardContent className="p-8 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <Label>Intervalo Mínimo (seg)</Label>
                                            <Input
                                                type="number"
                                                value={formData.minDelay}
                                                onChange={e => setFormData({ ...formData, minDelay: Number(e.target.value) })}
                                                className="w-32 text-center text-xl font-bold"
                                            />
                                        </div>
                                        <div className="h-0.5 flex-1 mx-8 bg-border relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-muted-foreground font-mono">
                                                ATÉ
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <Label>Intervalo Máximo (seg)</Label>
                                            <Input
                                                type="number"
                                                value={formData.maxDelay}
                                                onChange={e => setFormData({ ...formData, maxDelay: Number(e.target.value) })}
                                                className="w-32 text-center text-xl font-bold ml-auto"
                                            />
                                        </div>
                                    </div>

                                    {/* Risk Indicator */}
                                    <div className={cn("rounded-lg p-4 flex items-center justify-between", risk.bg)}>
                                        <div className="flex items-center gap-3">
                                            <Zap className={cn("w-6 h-6", risk.color)} />
                                            <div>
                                                <p className={cn("font-bold", risk.color)}>Nível de Risco: {risk.label}</p>
                                                <p className="text-sm opacity-80">Baseado nas configurações atuais</p>
                                            </div>
                                        </div>
                                        <div className="text-right text-sm font-mono opacity-70">
                                            ~{Math.round(3600 / ((formData.minDelay + formData.maxDelay) / 2))} envios/hora
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* STEP 5: LOTES (BATCHES) */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="text-center space-y-2 mb-8">
                                <h3 className="text-xl font-bold">Pausas e Lotes</h3>
                                <p className="text-muted-foreground">Faça pausas longas para "esfriar" o número após certa quantidade de envios.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                            <Layers className="w-6 h-6" />
                                        </div>
                                        <Label className="text-base">Tamanho do Lote</Label>
                                        <p className="text-sm text-muted-foreground">Quantas mensagens enviar antes de fazer uma pausa longa?</p>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                value={formData.batchSize}
                                                onChange={e => setFormData({ ...formData, batchSize: Number(e.target.value) })}
                                                className="h-12 text-lg font-bold"
                                            />
                                            <span className="text-muted-foreground font-medium">mensagens</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <Label className="text-base">Tempo de Pausa</Label>
                                        <p className="text-sm text-muted-foreground">Quanto tempo esperar entre os lotes?</p>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                value={formData.batchDelay}
                                                onChange={e => setFormData({ ...formData, batchDelay: Number(e.target.value) })}
                                                className="h-12 text-lg font-bold"
                                            />
                                            <span className="text-muted-foreground font-medium">segundos</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Alert>
                                <Info className="w-4 h-4" />
                                <AlertTitle>Resumo</AlertTitle>
                                <AlertDescription>
                                    O sistema enviará <strong>{formData.batchSize} mensagens</strong>,
                                    fará uma pausa de <strong>{Math.round(formData.batchDelay / 60)} minutos</strong>,
                                    e então continuará.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* STEP 6: PÚBLICO (AUDIENCE) */}\n                    {currentStep === 6 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="text-center space-y-2 mb-8">
                                <h3 className="text-xl font-bold">Quais contatos receberão?</h3>
                                <p className="text-muted-foreground">Selecione uma lista de contatos previamente importada.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {contactLists.map(list => (
                                    <div
                                        key={list.id}
                                        onClick={() => setFormData({ ...formData, contactListId: list.id })}
                                        className={cn(
                                            "cursor-pointer border-2 rounded-xl p-6 transition-all hover:shadow-lg relative overflow-hidden",
                                            formData.contactListId === list.id
                                                ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        {formData.contactListId === list.id && (
                                            <div className="absolute top-0 right-0 p-2 bg-primary text-white rounded-bl-xl">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                                                <Users className="w-5 h-5 text-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold truncate max-w-[150px]">{list.name}</h4>
                                                <p className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full inline-block">
                                                    {new Date().toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-2xl font-bold text-primary">{list.total_contacts}</span>
                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Contatos</span>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-1">
                                            {list.tags?.slice(0, 3).map((tag, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] h-5">{tag}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Add New List Helper */}
                                <div
                                    onClick={() => router.push('/dashboard/contacts')}
                                    className="cursor-pointer border-2 border-dashed border-muted hover:border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary transition-colors min-h-[180px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium">Criar Nova Lista</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-border bg-card/50 flex justify-between items-center">
                    {currentStep > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={loading}
                            className="gap-2 pl-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </Button>
                    ) : (
                        <div></div>
                    )}

                    {currentStep < 6 ? (
                        <Button
                            onClick={nextStep}
                            disabled={
                                (currentStep === 1 && (!formData.name || !formData.instanceId)) ||
                                (currentStep === 2 && messageVariations.filter(m => m.trim()).length === 0)
                            }
                            className="gap-2 px-8 shadow-lg shadow-primary/20"
                        >
                            Próximo <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !formData.contactListId}
                            className="gap-2 px-8 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? "Iniciando..." :
                                <>
                                    <Rocket className="w-4 h-4" /> Disparar Campanha
                                </>
                            }
                        </Button>
                    )}
                </div>
            </div>

            {/* Anti-Ban Warning Modal */}
            <AntiBanWarningModal
                isOpen={showAntiBanModal}
                onClose={() => setShowAntiBanModal(false)}
            />
        </div>
    )
}
