"use client"
import { useState, useEffect } from 'react'
import { User, CreditCard, Loader2, LogOut, Trash2, Check, Zap, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

import { api } from '@/services/api'
import { HelpBadge } from '@/components/ui/HelpBadge'
import { PixCheckoutModal } from '@/components/dashboard/PixCheckoutModal'
import { logoutUser } from '@/lib/supabase'

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 39.00,
        description: 'Mais popular',
        popular: true,
        features: ['5 campanhas de disparo por mês', '500 leads', '2 conexões WhatsApp', 'Suporte prioritário']
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 79.00,
        description: 'Para empresas',
        features: ['Disparos liberados (sem limite de campanhas)', 'Leads ilimitados', '5 conexões WhatsApp', 'Suporte VIP']
    }
]

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'plan'>('profile')

    // Payment State
    const [selectedPlanId, setSelectedPlanId] = useState(PLANS[0].id)
    const [showPixModal, setShowPixModal] = useState(false)

    const [name, setName] = useState('');

    // User State
    const [user, setUser] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        fetchUserProfile();
    }, []);

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

    const handleLogout = () => {
        logoutUser();
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            const result: any = await api.auth.deleteAccount();
            alert(result?.message || 'Conta excluída.');
            await logoutUser();
        } catch (error: any) {
            alert(error.message || 'Não foi possível excluir a conta. Tente novamente ou fale com o suporte.');
            setDeletingAccount(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                Configurações
                <HelpBadge size="sm" />
            </h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-border overflow-x-auto">
                {[
                    { id: 'profile', label: 'Perfil', icon: User },

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

                        <div className="pt-6 border-t border-border">
                            <h3 className="text-sm font-bold text-red-600 mb-1">Zona de perigo</h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Excluir sua conta apaga permanentemente seus leads, campanhas, conexões de WhatsApp e assinatura. Essa ação não pode ser desfeita.
                            </p>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 text-red-500 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" /> Excluir minha conta
                            </button>
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
                                    {user?.planName || 'Nenhum plano ativo'}
                                </span>
                            </div>
                        </div>

                        {/* Plan Selection */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Escolha um Plano</h3>
                            <div className="grid md:grid-cols-2 gap-4">
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
                                            {plan.price === 0 ? (
                                                <span className="text-3xl font-black">Grátis</span>
                                            ) : (
                                                <>
                                                    <span className="text-3xl font-black">R$ {plan.price.toFixed(2)}</span>
                                                    <span className="text-muted-foreground">/mês</span>
                                                </>
                                            )}
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
                                onClick={() => setShowPixModal(true)}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="w-5 h-5 fill-current" />
                                Assinar {PLANS.find(p => p.id === selectedPlanId)?.name} Agora
                            </button>
                            <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                                <Shield className="w-3 h-3" /> Pagamento 100% seguro via AbacatePay
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {showPixModal && (
                <PixCheckoutModal
                    planId={selectedPlanId}
                    onClose={() => setShowPixModal(false)}
                    onSuccess={() => {
                        setShowPixModal(false)
                        fetchUserProfile()
                    }}
                />
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="font-bold text-foreground mb-2">Tem certeza?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Isso vai apagar permanentemente sua conta, leads, campanhas e conexões de WhatsApp. Não tem como desfazer.
                        </p>
                        <p className="text-xs text-muted-foreground mb-1.5">Digite <strong>EXCLUIR</strong> para confirmar:</p>
                        <input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm mb-4"
                            placeholder="EXCLUIR"
                        />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'EXCLUIR' || deletingAccount}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir permanentemente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
