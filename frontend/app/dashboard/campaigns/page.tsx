"use client"
// Force HMR update


import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { ArrowRight, ArrowLeft, CheckCircle2, Rocket, Upload, FileText, Users, Settings2, Folder, Plus, X, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HelpBadge } from '@/components/ui/HelpBadge'
import { AntiBanWarningModal } from '@/components/modals/AntiBanWarningModal'

export default function NewCampaignPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<null | { type: 'success' | 'error', msg: string }>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        mediaType: 'text',
        contactListId: '',
        delaySeconds: 5,
        batchSize: 50,
        batchDelaySeconds: 10
    });
    const [messageVariations, setMessageVariations] = useState<string[]>(['']);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [instances, setInstances] = useState<any[]>([]);
    const [contactLists, setContactLists] = useState<any[]>([]);
    const [selectedInstanceId, setSelectedInstanceId] = useState('');
    const [showAntiBanWarning, setShowAntiBanWarning] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(false);

    useEffect(() => {
        // Fetch Instances
        api.instances.list().then(data => {
            setInstances(data);
            const connected = data.find((i: any) => i.status === 'open' || i.status === 'connected');
            if (connected) setSelectedInstanceId(connected.id);
            else if (data.length > 0) setSelectedInstanceId(data[0].id);
        }).catch(console.error);

        // Fetch Contact Lists
        api.contacts.list().then(setContactLists).catch(console.error);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    // Check if settings are risky
    const checkRiskySettings = () => {
        const { delaySeconds, batchSize, batchDelaySeconds } = formData;

        // Configurações arriscadas
        if (delaySeconds < 5 || batchSize > 50 || batchDelaySeconds < 60) {
            return true;
        }

        return false;
    };

    // Get total contacts count
    const getTotalContacts = () => {
        const selectedList = contactLists.find(list => list.id === formData.contactListId);
        return selectedList?.contact_count || 0;
    };

    async function handleSubmit(skipWarning = false) {
        // Check for risky settings first
        if (!skipWarning && checkRiskySettings()) {
            setPendingSubmit(true);
            setShowAntiBanWarning(true);
            return;
        }

        setLoading(true);
        setStatus(null);
        setPendingSubmit(false);

        try {
            // 1. Get Selected Instance
            const connectedInstance = instances.find(i => i.id === selectedInstanceId);

            if (!connectedInstance) {
                throw new Error("Nenhuma instância do WhatsApp selecionada ou encontrada. Vá em Configurações e conecte.");
            }

            if (connectedInstance.status !== 'open' && connectedInstance.status !== 'connected') {
                throw new Error(`A instância "${connectedInstance.name}" não está conectada. Por favor, conecte-a nas configurações.`);
            }

            // 2. Validate Contact List
            if (!formData.contactListId) {
                throw new Error("Selecione uma lista de contatos para enviar a campanha.");
            }

            // 3. Validate Message Variations
            const validVariations = messageVariations.filter(m => m.trim().length > 0);
            if (validVariations.length === 0) {
                throw new Error("Adicione pelo menos uma variação de mensagem.");
            }

            // 4. Create Campaign
            const campaignData = new FormData();
            campaignData.append('name', formData.name);
            campaignData.append('messageVariations', JSON.stringify(validVariations));
            campaignData.append('contactListId', formData.contactListId);
            campaignData.append('instanceId', connectedInstance.id);
            campaignData.append('delaySeconds', formData.delaySeconds.toString());
            campaignData.append('batchSize', formData.batchSize.toString());
            campaignData.append('batchDelaySeconds', formData.batchDelaySeconds.toString());
            campaignData.append('mediaType', formData.mediaType);

            if (mediaFile) {
                campaignData.append('media', mediaFile);
            }

            const result = await api.campaigns.create(campaignData);

            // Automate "Create Campaign" onboarding step
            try {
                const saved = localStorage.getItem('onboarding-checklist')
                const savedData = saved ? JSON.parse(saved) : {}

                if (!savedData['create-campaign']) {
                    const newData = { ...savedData, 'create-campaign': true }
                    localStorage.setItem('onboarding-checklist', JSON.stringify(newData))
                    window.dispatchEvent(new Event('onboarding-update'))
                }
            } catch (e) {
                console.error('Error updating onboarding status:', e)
            }

            setStatus({ type: 'success', msg: 'Campanha criada e agendada com sucesso! 🚀' });
            // Reset after success
            setTimeout(() => {
                window.location.href = `/dashboard/campaigns/${result.id}`; // Redirect to details page
            }, 1500);

        } catch (error: any) {
            console.error(error);
            setStatus({ type: 'error', msg: error.message || 'Erro ao criar campanha.' });
        } finally {
            setLoading(false);
        }
    }

    const steps = [
        { number: 1, title: "Configuração", icon: Settings2 },
        { number: 2, title: "Mensagem", icon: FileText },
        { number: 3, title: "Público", icon: Users },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
                    Nova Campanha
                    <HelpBadge size="sm" />
                </h1>
                <p className="text-muted-foreground">Crie seu disparo em massa em 3 passos simples.</p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 transform -translate-y-1/2 hidden md:block" />
                <div className="flex gap-4 md:gap-20 w-full md:w-auto justify-between md:justify-center px-4">
                    {steps.map((step) => (
                        <div key={step.number} className={cn(
                            "flex flex-col items-center gap-2 bg-background z-10 transition-all",
                            currentStep >= step.number ? "text-primary" : "text-muted-foreground"
                        )}>
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentStep >= step.number ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                            )}>
                                {currentStep > step.number ? <CheckCircle2 className="w-6 h-6" /> : step.number}
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider">{step.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden min-h-[400px] flex flex-col relative">

                {/* Status Message Overlay */}
                {status && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                        <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center mb-4",
                            status.type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                            {status.type === 'success' ? <Rocket className="w-10 h-10" /> : <ArrowLeft className="w-10 h-10" />}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{status.type === 'success' ? 'Sucesso!' : 'Algo deu errado'}</h3>
                        <p className="text-muted-foreground text-lg mb-6">{status.msg}</p>

                        {status.type === 'error' && (
                            <button
                                onClick={() => setStatus(null)}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
                            >
                                Voltar e Corrigir
                            </button>
                        )}
                    </div>
                )}

                {/* Form Content */}
                <div className="p-8 flex-1">

                    {/* STEP 1: CONFIGURATION */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Nome da Campanha</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        type="text"
                                        placeholder="Ex: Oferta de Natal"
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Instância do WhatsApp</label>
                                    <select
                                        name="instanceId"
                                        value={selectedInstanceId}
                                        onChange={(e) => setSelectedInstanceId(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="" disabled>Selecione uma instância</option>
                                        {instances.map(inst => (
                                            <option key={inst.id} value={inst.id}>
                                                {inst.name} ({inst.status === 'open' || inst.status === 'connected' ? 'Conectado' : 'Desconectado'})
                                            </option>
                                        ))}
                                    </select>
                                    {instances.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">Nenhuma instância encontrada. Crie uma nas configurações.</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Tipo de Mídia</label>
                                    <select
                                        name="mediaType"
                                        value={formData.mediaType}
                                        onChange={handleInputChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="text">Apenas Texto</option>
                                        <option value="image">Imagem + Texto</option>
                                        <option value="video">Vídeo + Texto</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 bg-accent/30 rounded-lg border border-border/50 space-y-4">
                                <h3 className="font-semibold text-sm flex items-center gap-2"><Settings2 className="w-4 h-4" /> Configurações de Envio (Anti-Ban)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Delay (seg)</label>
                                        <input name="delaySeconds" type="number" min="1" value={formData.delaySeconds} onChange={handleInputChange} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Lote (qtd)</label>
                                        <input name="batchSize" type="number" min="1" value={formData.batchSize} onChange={handleInputChange} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Pausa Lote (seg)</label>
                                        <input name="batchDelaySeconds" type="number" min="1" value={formData.batchDelaySeconds} onChange={handleInputChange} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CONTENT */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            {formData.mediaType !== 'text' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Upload da Mídia</label>
                                    <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-accent/50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept={formData.mediaType === 'image' ? "image/*" : "video/*"}
                                            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <Upload className={cn("w-10 h-10 mb-2 transition-colors", mediaFile ? "text-primary" : "text-muted-foreground")} />
                                        {mediaFile ? (
                                            <span className="font-bold text-primary">{mediaFile.name}</span>
                                        ) : (
                                            <span className="text-muted-foreground">Clique ou arraste seu arquivo aqui</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Variações de Mensagem</label>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Shuffle className="w-3 h-3" />
                                            O sistema escolherá aleatoriamente uma variação para cada contato
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-full">
                                        {messageVariations.filter(m => m.trim()).length} variações
                                    </span>
                                </div>

                                {messageVariations.map((variation, index) => (
                                    <div key={index} className="relative border border-border rounded-xl p-4 bg-background/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-muted-foreground">Variação {index + 1}</span>
                                            {messageVariations.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newVariations = messageVariations.filter((_, i) => i !== index)
                                                        setMessageVariations(newVariations)
                                                    }}
                                                    className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <textarea
                                            value={variation}
                                            onChange={(e) => {
                                                const newVariations = [...messageVariations]
                                                newVariations[index] = e.target.value
                                                setMessageVariations(newVariations)
                                            }}
                                            rows={5}
                                            placeholder="Olá {nome}, tudo bem? Tenho uma oportunidade..."
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
                                            autoFocus={index === 0}
                                        ></textarea>
                                        <p className="text-xs text-muted-foreground text-right mt-1">{variation.length} caracteres</p>
                                    </div>
                                ))}

                                {messageVariations.length < 10 && (
                                    <button
                                        type="button"
                                        onClick={() => setMessageVariations([...messageVariations, ''])}
                                        className="w-full py-3 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Adicionar Variação
                                    </button>
                                )}

                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
                                    <p className="font-medium text-primary mb-1">💡 Dica:</p>
                                    <p>Use {'{nome}'} para personalizar com o nome do contato. Crie variações sutis para tornar o envio mais natural e evitar bloqueios.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: AUDIENCE */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Selecione a Lista de Contatos</label>
                                {contactLists.length > 0 ? (
                                    <select
                                        name="contactListId"
                                        value={formData.contactListId}
                                        onChange={handleInputChange}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                        autoFocus
                                    >
                                        <option value="" disabled>Selecione uma pasta...</option>
                                        {contactLists.map(list => (
                                            <option key={list.id} value={list.id}>
                                                {list.name} ({new Date(list.created_at).toLocaleDateString()})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                        <Folder className="w-10 h-10 text-red-500 mx-auto mb-3" />
                                        <h4 className="font-bold text-red-600 mb-1">Nenhuma lista encontrada</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Você precisa importar contatos na página de Leads antes de criar uma campanha.
                                        </p>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                    A campanha será enviada para todos os contatos da pasta selecionada.
                                </p>
                            </div>

                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-primary text-sm">Pronto para disparar?</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Ao confirmar, a campanha <strong>{formData.name}</strong> será criada e as mensagens começarão a ser enviadas conforme as configurações de delay.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-border bg-card/50 flex justify-between items-center">
                    {currentStep > 1 ? (
                        <button
                            onClick={prevStep}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {currentStep < 3 ? (
                        <button
                            onClick={nextStep}
                            disabled={!formData.name || formData.name.length < 3} // Name must be at least 3 chars
                            className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próximo <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleSubmit()}
                            disabled={loading || !formData.contactListId}
                            className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {loading ? "Iniciando..." :
                                <>
                                    <Rocket className="w-4 h-4" /> Disparar Campanha
                                </>
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Anti-Ban Warning Modal */}
            <AntiBanWarningModal
                isOpen={showAntiBanWarning}
                onClose={() => {
                    setShowAntiBanWarning(false);
                    setPendingSubmit(false);
                }}
                onConfirm={() => {
                    setShowAntiBanWarning(false);
                    handleSubmit(true); // Skip warning check
                }}
                delaySeconds={formData.delaySeconds}
                batchSize={formData.batchSize}
                batchDelaySeconds={formData.batchDelaySeconds}
                totalContacts={getTotalContacts()}
            />
        </div>
    )
}
