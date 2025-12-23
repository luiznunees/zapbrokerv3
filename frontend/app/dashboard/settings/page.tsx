"use client"
import { useState, useEffect } from 'react'
import { User, Smartphone, CreditCard, Moon, Sun, Monitor, Loader2, LogOut, Plus, Trash2, RefreshCw, X, Check, Zap, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { api } from '@/services/api'
import { QRCodeModal } from '@/components/dashboard/QRCodeModal'
import { PixQRCodeModal } from '@/components/payment/PixQRCodeModal'
import { useSearchParams } from 'next/navigation'

const PLANS = [
    {
        id: 'prod_ZxwseRQWbKLxHKsnfcUCMfYc',
        name: 'Básico',
        price: 29.00,
        description: 'Ideal para começar',
        features: ['50 mensagens/semana', '1 instância WhatsApp', 'IA Personalizável', 'Sistema Anti-Ban', 'Suporte por email']
    },
    {
        id: 'prod_n6CMApuNhHqPCUrL2JmHyWbz',
        name: 'Plus',
        price: 69.00,
        description: 'Mais popular',
        popular: true,
        features: ['125 mensagens/semana', '2 conexões WhatsApp', 'IA Personalizável', 'Analytics avançado', 'Suporte prioritário']
    },
    {
        id: 'prod_AXPStPBEeB5xrpubKyWB6EnY',
        name: 'Pro',
        price: 119.00,
        description: 'Para empresas',
        features: ['250 mensagens/semana', '5 conexões WhatsApp', 'IA Personalizável', 'API Access', 'Suporte VIP']
    }
]

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState<'profile' | 'connection' | 'plan' | 'appearance'>('profile')

    // Payment State
    const [selectedPlanId, setSelectedPlanId] = useState(PLANS[1].id)
    const [loadingPayment, setLoadingPayment] = useState(false)
    const [pixData, setPixData] = useState<any>(null)
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
    const [billingDetails, setBillingDetails] = useState({
        name: '',
        email: '',
        cellphone: '',
        taxId: ''
    })

    const [name, setName] = useState('');

    // User State
    const [user, setUser] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Connection State
    const [instances, setInstances] = useState<any[]>([]);
    const [loadingInstances, setLoadingInstances] = useState(true);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [connectingInstanceId, setConnectingInstanceId] = useState<string | null>(null);
    const [isNewInstanceModalOpen, setIsNewInstanceModalOpen] = useState(false);
    const [newInstanceName, setNewInstanceName] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Read tab from URL query params
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'whatsapp') {
            setActiveTab('connection')
        }
    }, [searchParams])

    useEffect(() => {
        fetchUserProfile();
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

    const fetchUserProfile = async () => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) setUser(JSON.parse(storedUser));
            const freshUser = await api.auth.me().catch(() => null);
            if (freshUser) {
                setUser(freshUser.user);
                localStorage.setItem('user', JSON.stringify(freshUser.user));

                // Set name preference explicitly if needed
                setName(freshUser.user.name || '');
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoadingUser(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoadingUser(true);
            const updates = {
                nome: name,
                email_notifications: user.onboarding_steps?.email_notifications ?? true,
                quota_alerts: user.onboarding_steps?.quota_alerts ?? true
            };

            const updatedUser = await api.auth.updateProfile(updates);
            setUser({ ...user, ...updatedUser });
            localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }));
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Failed to save profile', error);
            alert('Erro ao salvar perfil.');
        } finally {
            setLoadingUser(false);
        }
    };

    const handleTogglePreference = async (key: string, value: boolean) => {
        try {
            // Optimistic update
            const newUser = {
                ...user,
                onboarding_steps: {
                    ...(user.onboarding_steps || {}),
                    [key]: value
                }
            };
            setUser(newUser);

            await api.auth.updateProfile({
                [key]: value
            });

            localStorage.setItem('user', JSON.stringify(newUser));
        } catch (error) {
            console.error(`Failed to toggle ${key}`, error);
            // Revert on error
            fetchUserProfile();
        }
    };

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
            await api.instances.create(newInstanceName);
            setNewInstanceName('');
            setIsNewInstanceModalOpen(false);
            await fetchInstances();
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

    const handleConnect = async (instanceId: string) => {
        setConnectingInstanceId(instanceId);
        setIsQRModalOpen(true);
        setQrLoading(true);
        setQrCode(null);

        try {
            const data = await api.instances.connect(instanceId);
            if (data.base64) {
                setQrCode(data.base64);
            }
        } catch (error) {
            console.error('Failed to connect');
            setIsQRModalOpen(false);
        } finally {
            setQrLoading(false);
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-border overflow-x-auto">
                {[
                    { id: 'profile', label: 'Perfil', icon: User },
                    { id: 'connection', label: 'Conexão WhatsApp', icon: Smartphone },
                    { id: 'appearance', label: 'Aparência', icon: Moon },
                    { id: 'plan', label: 'Assinatura', icon: CreditCard },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "px-4 md:px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                            activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm min-h-[400px]">

                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 max-w-lg animate-in fade-in slide-in-from-left-4">
                        <div className="flex items-center gap-4">
                            {loadingUser ? (
                                <div className="w-20 h-20 bg-muted animate-pulse rounded-full" />
                            ) : (
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl font-bold uppercase border-2 border-primary/20">
                                    {user?.name?.substring(0, 2) || user?.email?.substring(0, 2) || 'US'}
                                </div>
                            )}
                            <div>
                                {loadingUser ? (
                                    <div className="space-y-2">
                                        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                                        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="font-bold text-lg">{user?.name || 'Usuário'}</h3>
                                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1">Nome Completo</label>
                                {loadingUser ? (
                                    <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
                                ) : (
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1">Email</label>
                                {loadingUser ? (
                                    <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
                                ) : (
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground cursor-not-allowed"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border space-y-4">
                            <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Preferências</h4>

                            <div className="grid gap-4">
                                <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                    <div>
                                        <h5 className="font-medium">Notificações por Email</h5>
                                        <p className="text-xs text-muted-foreground">Receber alertas de campanhas e quotas</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={user?.onboarding_steps?.email_notifications !== false}
                                            onChange={(e) => handleTogglePreference('email_notifications', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                    <div>
                                        <h5 className="font-medium">Alertas de Quota</h5>
                                        <p className="text-xs text-muted-foreground">Avisar quando atingir 80% da quota</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={user?.onboarding_steps?.quota_alerts !== false}
                                            onChange={(e) => handleTogglePreference('quota_alerts', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Idioma</label>
                                    <select className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none">
                                        <option value="pt-BR">Português (Brasil)</option>
                                        <option value="en-US">English (US)</option>
                                        <option value="es-ES">Español</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-border">
                            <button
                                onClick={handleSaveProfile}
                                disabled={loadingUser}
                                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {loadingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                            </button>

                            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors text-sm">
                                <LogOut className="w-4 h-4" /> Sair da conta
                            </button>
                        </div>
                    </div>
                )}

                {/* CONNECTION TAB */}
                {activeTab === 'connection' && (
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
                                    <h4 className="font-bold text-red-700 dark:text-red-400 mb-1">Limite do Plano Atingido</h4>
                                    <p className="text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
                                    <button
                                        onClick={() => window.location.href = '/dashboard/checkout'}
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
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Carregando instâncias...</p>
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
                            isLoading={qrLoading}
                            onRetry={() => connectingInstanceId && handleConnect(connectingInstanceId)}
                        />

                    </div>
                )}
                {activeTab === 'appearance' && (
                    <div className="max-w-xl space-y-8 animate-in fade-in">
                        <div>
                            <h3 className="font-bold text-lg mb-4">Tema da Interface</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-accent",
                                        theme === 'light' ? "border-primary bg-primary/5" : "border-border"
                                    )}
                                >
                                    <Sun className="w-8 h-8" />
                                    <span className="font-medium text-sm">Claro</span>
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-accent",
                                        theme === 'dark' ? "border-primary bg-primary/5" : "border-border"
                                    )}
                                >
                                    <Moon className="w-8 h-8" />
                                    <span className="font-medium text-sm">Escuro</span>
                                </button>
                                <button
                                    onClick={() => setTheme('system')}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-accent",
                                        theme === 'system' ? "border-primary bg-primary/5" : "border-border"
                                    )}
                                >
                                    <Monitor className="w-8 h-8" />
                                    <span className="font-medium text-sm">Sistema</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PLAN TAB */}
                {activeTab === 'plan' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Seu Plano Atual</h3>
                                <p className="text-muted-foreground">Gerencie sua assinatura e cobrança.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase border border-primary/20">
                                    {user?.planName || 'Gratuito / Teste'}
                                </span>
                            </div>
                        </div>

                        {/* Plan Selection */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Escolha um Plano</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {PLANS.map((plan) => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={cn(
                                            "relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg",
                                            selectedPlanId === plan.id
                                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                : "border-border bg-card hover:border-primary/50"
                                        )}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-sm">
                                                Mais Popular
                                            </div>
                                        )}
                                        <div className="mb-4">
                                            <h4 className="font-bold text-lg">{plan.name}</h4>
                                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                                        </div>
                                        <div className="mb-6">
                                            <span className="text-3xl font-black">R$ {plan.price.toFixed(2)}</span>
                                            <span className="text-muted-foreground">/mês</span>
                                        </div>
                                        <ul className="space-y-2 mb-6">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Updated Billing Section */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Checkout Seguro
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Você será redirecionado para o checkout seguro da AbacatePay para concluir sua assinatura via PIX.
                            </p>

                            <button
                                disabled={loadingPayment}
                                onClick={() => {
                                    setLoadingPayment(true);
                                    window.location.href = `/checkout/redirect?planId=${selectedPlanId}`;
                                }}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                            >
                                {loadingPayment ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 fill-current" />
                                        Assinar {PLANS.find(p => p.id === selectedPlanId)?.name} Agora
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                                <Shield className="w-3 h-3" /> Pagamento 100% seguro via AbacatePay
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    )
}
