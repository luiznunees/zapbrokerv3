"use client"
import { useState, useEffect, useRef } from 'react'
import { Smartphone, Loader2, Plus, Trash2, LogOut, X } from 'lucide-react'
import { cn } from '@/lib/utils'

import { api } from '@/services/api'
import { QRCodeModal } from '@/components/dashboard/QRCodeModal'
import { HelpBadge } from '@/components/ui/HelpBadge'
import { BrandLoader } from '@/components/ui/BrandLoader'
import { DedicatedNumberPanel } from '@/components/dashboard/DedicatedNumberPanel'

export default function ConnectionPage() {
    const [instances, setInstances] = useState<any[]>([]);
    const [loadingInstances, setLoadingInstances] = useState(true);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [connectingInstanceId, setConnectingInstanceId] = useState<string | null>(null);
    const [isNewInstanceModalOpen, setIsNewInstanceModalOpen] = useState(false);
    const [newInstanceName, setNewInstanceName] = useState('');
    const [newInstancePhone, setNewInstancePhone] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const connectRequestId = useRef(0);

    useEffect(() => {
        fetchInstances();
    }, []);

    // Polling for connection status when modal is open
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isQRModalOpen) {
            interval = setInterval(fetchInstances, 3000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isQRModalOpen]);

    const fetchInstances = async () => {
        try {
            const data = await api.instances.list();
            setInstances(data);

            // If we are waiting for a connection in the modal
            if (isQRModalOpen && connectingInstanceId) {
                const current = data.find((i: any) => i.id === connectingInstanceId);
                if (current?.status === 'connected' || current?.status === 'open') {
                    setIsQRModalOpen(false);
                    setConnectingInstanceId(null);
                    // Connected silently
                }
            }
        } catch (error) {
            console.error('Failed to fetch instances', error);
        } finally {
            setLoadingInstances(false);
        }
    };

    const handleCreateInstance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newInstanceName.trim()) return;

        try {
            setLoadingInstances(true);
            setErrorMessage(null); // Clear previous errors
            const phone = newInstancePhone.trim() || undefined;
            const created = await api.instances.create(newInstanceName, phone);
            setNewInstanceName('');
            setNewInstancePhone('');
            setIsNewInstanceModalOpen(false);
            await fetchInstances();

            // Criar já com o número devolve QR/pairing code na hora — mostra direto,
            // sem precisar de um segundo passo de "Conectar" (que é o caminho instável).
            if (phone && (created.base64 || created.pairingCode)) {
                setConnectingInstanceId(created.id);
                setQrCode(created.base64 || null);
                setPairingCode(created.pairingCode || null);
                setQrLoading(false);
                setIsQRModalOpen(true);
            }
        } catch (error: any) {
            console.error('Failed to create instance:', error);

            // Show user-friendly error message
            if (error.message?.includes('Plan limit reached')) {
                setErrorMessage(error.message);
            } else if (error.message?.includes('limit')) {
                setErrorMessage('Você atingiu o limite do seu plano. Faça upgrade para adicionar mais instâncias.');
            } else {
                setErrorMessage('Erro ao criar instância. Tente novamente.');
            }
        } finally {
            setLoadingInstances(false);
        }
    };

    const handleConnect = async (instanceId: string, phoneNumber?: string) => {
        const requestId = ++connectRequestId.current;

        setConnectingInstanceId(instanceId);
        setIsQRModalOpen(true);
        setQrLoading(true);
        setQrCode(null);
        setPairingCode(null);

        try {
            const data = await api.instances.connect(instanceId, phoneNumber);
            // Uma requisição de código mais nova pode ter sido disparada enquanto essa
            // ainda estava em voo — ignora a resposta velha pra não mostrar um código/QR
            // desatualizado por cima do que o usuário já pediu depois.
            if (requestId !== connectRequestId.current) return;
            if (data.base64) {
                setQrCode(data.base64);
            }
            if (data.pairingCode) {
                setPairingCode(data.pairingCode);
            }
        } catch (error) {
            console.error('Failed to connect');
            if (requestId === connectRequestId.current) setIsQRModalOpen(false);
        } finally {
            if (requestId === connectRequestId.current) setQrLoading(false);
        }
    };

    const handleLogoutInstance = async (id: string) => {
        if (!confirm('Deseja realmente desconectar esta instância?')) return;
        try {
            await api.instances.logout(id);
            await fetchInstances();
        } catch (error: any) {
            console.error('Failed to disconnect:', error);
        }
    };

    const handleDeleteInstance = async (id: string) => {
        if (!confirm('Deseja realmente EXCLUIR esta instância? Esta ação não pode ser desfeita.')) return;
        try {
            await api.instances.delete(id);
            await fetchInstances();
        } catch (error: any) {
            console.error('Failed to delete:', error);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-3">
                Conexão WhatsApp
                <HelpBadge size="sm" />
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
                Conecte seus números de WhatsApp e gerencie seus aparelhos.
            </p>

            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm min-h-[400px]">
                <div className="space-y-6 animate-in fade-in">
                    <DedicatedNumberPanel
                        onCreateInstance={() => setIsNewInstanceModalOpen(true)}
                        onConnect={(instanceId, phoneNumber) => handleConnect(instanceId, phoneNumber)}
                        instances={instances}
                    />

                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold">Instâncias do WhatsApp</h3>
                            <p className="text-sm text-muted-foreground">Gerencie suas conexões e aparelhos.</p>
                        </div>
                        <button
                            onClick={() => setIsNewInstanceModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Nova Instância
                        </button>
                    </div>

                    {/* Error Message Banner */}
                    {errorMessage && (
                        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">!</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-red-700 mb-1">Limite do Plano Atingido</h4>
                                <p className="text-sm text-red-600">{errorMessage}</p>
                                <button
                                    onClick={() => { setErrorMessage(null); window.location.href = '/dashboard/settings?tab=plan'; }}
                                    className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                                >
                                    Fazer Upgrade do Plano
                                </button>
                            </div>
                            <button
                                onClick={() => setErrorMessage(null)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {loadingInstances ? (
                        <div className="py-8">
                            <BrandLoader size="md" label="Carregando instâncias..." />
                        </div>
                    ) : instances.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                            <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                            <h4 className="font-medium mb-1">Nenhuma instância encontrada</h4>
                            <p className="text-sm text-muted-foreground mb-6">Crie sua primeira instância para começar.</p>
                            <button
                                onClick={() => setIsNewInstanceModalOpen(true)}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                            >
                                Criar Agora
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {instances.map((instance) => (
                                <div key={instance.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-background/50 hover:bg-background transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center",
                                            instance.status === 'connected' || instance.status === 'open' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                        )}>
                                            <Smartphone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold">{instance.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    instance.status === 'connected' || instance.status === 'open' ? "bg-green-500" : "bg-red-500"
                                                )} />
                                                <span className="text-xs uppercase font-medium text-muted-foreground">
                                                    {instance.status === 'connected' || instance.status === 'open' ? 'Conectado' : 'Desconectado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {instance.status === 'connected' || instance.status === 'open' ? (
                                            <button
                                                onClick={() => handleLogoutInstance(instance.id)}
                                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Desconectar"
                                            >
                                                <LogOut className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleConnect(instance.id)}
                                                className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg text-sm font-bold transition-all"
                                            >
                                                Conectar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteInstance(instance.id)}
                                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* New Instance Modal */}
                    {isNewInstanceModalOpen && (
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-border flex justify-between items-center">
                                    <h3 className="text-xl font-bold">Nova Instância</h3>
                                    <button onClick={() => setIsNewInstanceModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateInstance} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Nome da Instância</label>
                                        <input
                                            type="text"
                                            value={newInstanceName}
                                            onChange={(e) => setNewInstanceName(e.target.value)}
                                            placeholder="Ex: Vendas, Suporte, Principal"
                                            className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                                            autoFocus
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">Use um nome fácil de identificar.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Número de WhatsApp (opcional)</label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            value={newInstancePhone}
                                            onChange={(e) => setNewInstancePhone(e.target.value.replace(/\D/g, ''))}
                                            placeholder="5511999999999 (com DDI e DDD)"
                                            className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">Informar aqui gera o QR/código de pareamento já na criação — mais confiável do que conectar depois.</p>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsNewInstanceModalOpen(false)}
                                            className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newInstanceName.trim() || loadingInstances}
                                            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {loadingInstances ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar Instância'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <QRCodeModal
                        isOpen={isQRModalOpen}
                        onClose={() => {
                            setIsQRModalOpen(false);
                            setConnectingInstanceId(null);
                        }}
                        qrCode={qrCode}
                        pairingCode={pairingCode}
                        isLoading={qrLoading}
                        onRetry={() => connectingInstanceId && handleConnect(connectingInstanceId)}
                        onRequestPairingCode={(phoneNumber) => connectingInstanceId && handleConnect(connectingInstanceId, phoneNumber)}
                    />

                </div>
            </div>
        </div>
    )
}