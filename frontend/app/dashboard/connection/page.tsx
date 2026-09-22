"use client"
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Smartphone, Loader2, Plus, Trash2, LogOut, X, LifeBuoy } from 'lucide-react'
import { cn } from '@/lib/utils'

import { api } from '@/services/api'
import { QRCodeModal } from '@/components/dashboard/QRCodeModal'
import { toFullPhoneDigits } from '@/lib/phone'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { HelpBadge } from '@/components/ui/HelpBadge'
import { BrandLoader } from '@/components/ui/BrandLoader'

// Instância não conectada há mais que isso vira o aviso de "pode ter sido banido" — nunca
// afirma banimento (a gente não tem como confirmar isso, só o WhatsApp no celular sabe),
// só oferece o guia de recuperação de forma proativa.
const PROLONGED_DISCONNECT_MS = 24 * 60 * 60 * 1000;

function statusMeta(status: string) {
    switch (status) {
        case 'connected':
        case 'open':
            return { dot: 'bg-green-500', iconBg: 'bg-green-500/10 text-green-500', label: 'Conectado' };
        case 'connecting':
            return { dot: 'bg-sky-500 animate-pulse', iconBg: 'bg-sky-500/10 text-sky-500', label: 'Conectando' };
        case 'error':
            return { dot: 'bg-red-500', iconBg: 'bg-red-500/10 text-red-500', label: 'Erro' };
        default:
            return { dot: 'bg-zinc-400', iconBg: 'bg-zinc-400/10 text-zinc-500', label: 'Desconectado' };
    }
}

function healthMeta(level?: 'boa' | 'atencao' | 'risco') {
    switch (level) {
        case 'risco': return { label: 'Risco', className: 'bg-red-500/10 text-red-600' };
        case 'atencao': return { label: 'Atenção', className: 'bg-amber-500/10 text-amber-600' };
        case 'boa': return { label: 'Saudável', className: 'bg-emerald-500/10 text-emerald-600' };
        default: return null;
    }
}

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
    const [chipAgeDays, setChipAgeDays] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const connectRequestId = useRef(0);

    // A idade real do chip no WhatsApp é o que determina o risco de bloqueio — não a data
    // em que ele foi conectado aqui (ver campaignService.ts getWarmupInfo). null = não informado.
    const CHIP_AGE_OPTIONS: Array<{ label: string; days: number | null }> = [
        { label: 'É novo (comprei/ativei agora)', days: 0 },
        { label: 'Uso há alguns dias', days: 3 },
        { label: 'Uso há 1-2 semanas', days: 10 },
        { label: 'Mais de 1 mês, já maduro', days: 20 },
    ];

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

    // Checagem manual disparada pelo botão "Já conectei" — mesma lógica do polling, mas
    // na hora, pra dar feedback imediato em vez de esperar o próximo ciclo de 3s.
    const checkConnectionNow = async (): Promise<boolean> => {
        try {
            const data = await api.instances.list();
            setInstances(data);
            if (connectingInstanceId) {
                const current = data.find((i: any) => i.id === connectingInstanceId);
                if (current?.status === 'connected' || current?.status === 'open') {
                    setIsQRModalOpen(false);
                    setConnectingInstanceId(null);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Failed to check connection', error);
            return false;
        }
    };

    const handleCreateInstance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newInstanceName.trim()) return;

        try {
            setLoadingInstances(true);
            setErrorMessage(null); // Clear previous errors
            const phone = toFullPhoneDigits(newInstancePhone) || undefined;
            const created = await api.instances.create(newInstanceName, phone, chipAgeDays);
            setNewInstanceName('');
            setNewInstancePhone('');
            setChipAgeDays(null);
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
        } catch (error: any) {
            console.error('Failed to connect');
            if (requestId === connectRequestId.current) {
                setIsQRModalOpen(false);
                setErrorMessage(error?.message || 'Erro ao conectar. Tente novamente.');
                await fetchInstances();
            }
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
                        <div className="grid gap-3">
                            {instances.map((instance) => {
                                const isConnected = instance.status === 'connected' || instance.status === 'open';
                                const status = statusMeta(instance.status);
                                const health = healthMeta(instance.health?.level);
                                const disconnectedTooLong = !isConnected && instance.status_since &&
                                    (Date.now() - new Date(instance.status_since).getTime()) > PROLONGED_DISCONNECT_MS;

                                return (
                                    <div key={instance.id} className="border border-border rounded-xl bg-background/50 hover:bg-background transition-colors overflow-hidden">
                                        <div className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", status.iconBg)}>
                                                    <Smartphone className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold">{instance.name}</h4>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={cn("w-2 h-2 rounded-full", status.dot)} />
                                                        <span className="text-xs uppercase font-medium text-muted-foreground">{status.label}</span>
                                                        {isConnected && health && (
                                                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", health.className)}>
                                                                {health.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isConnected && instance.health && (
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {instance.health.warmup?.daysSinceConnected !== null
                                                                ? `${instance.health.warmup.daysSinceConnected}d de chip`
                                                                : 'idade do chip não informada'}
                                                            {instance.health.replyRatePct !== null ? ` · ${instance.health.replyRatePct}% de resposta` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isConnected ? (
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

                                        {disconnectedTooLong && (
                                            <div className="flex items-center justify-between gap-3 bg-red-500/5 border-t border-red-500/20 px-4 py-2.5">
                                                <p className="text-xs text-red-600">Esse número está desconectado há mais de 1 dia.</p>
                                                <Link href="/dashboard/connection/banido" className="text-xs font-bold text-red-600 underline underline-offset-2 shrink-0">
                                                    Pode ter sido banido? Veja o que fazer
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="text-center pt-1">
                                <Link
                                    href="/dashboard/connection/banido"
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <LifeBuoy className="w-3.5 h-3.5" />
                                    Um número foi banido? Veja o que fazer
                                </Link>
                            </div>
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
                                        <PhoneInput
                                            value={newInstancePhone}
                                            onChange={setNewInstancePhone}
                                            className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus-within:ring-2 focus-within:ring-primary/20"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">Informar aqui gera o QR/código de pareamento já na criação — mais confiável do que conectar depois.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Esse chip já tem uso real no WhatsApp?</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {CHIP_AGE_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.label}
                                                    type="button"
                                                    onClick={() => setChipAgeDays(opt.days)}
                                                    className={cn(
                                                        "px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors",
                                                        chipAgeDays === opt.days ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            É a idade real do chip que importa pro risco de bloqueio — não a data em que ele foi conectado aqui. Um chip já maduro corre menos risco mesmo conectando hoje.
                                        </p>
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
                        onCheckNow={checkConnectionNow}
                    />

                </div>
            </div>
        </div>
    )
}