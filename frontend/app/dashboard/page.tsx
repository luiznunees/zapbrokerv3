"use client";

import { ArrowUpRight, Users, MessageSquare, CheckCircle, Send, Plus, BarChart2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { QRCodeModal } from '@/components/dashboard/QRCodeModal';
import { QuotaWidget } from '@/components/dashboard/QuotaWidget';
import { WhatsAppStatusWidget } from '@/components/dashboard/WhatsAppStatusWidget';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

import { InputModal } from '@/components/modals/InputModal';
import Link from 'next/link';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        leads: '0',
        campaigns: '0',
        deliveryRate: '0%',
        responses: '0'
    });
    const [instanceStatus, setInstanceStatus] = useState<string>('disconnected');
    const [loading, setLoading] = useState(true);
    const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
    const [showInstanceNameModal, setShowInstanceNameModal] = useState(false);

    // QR Code Modal State
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);

    // Polling for connection status when modal is open
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isQRModalOpen && !instanceStatus.includes('connected')) {
            interval = setInterval(async () => {
                try {
                    const instances = await api.instances.list().catch(() => []);
                    const connected = instances.find((i: any) => i.status === 'open' || i.status === 'connected');

                    if (connected) {
                        setInstanceStatus('connected');
                        setIsQRModalOpen(false);
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error('Polling error', err);
                }
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isQRModalOpen, instanceStatus]);

    useEffect(() => {
        // Debounce to avoid multiple simultaneous calls (React StrictMode)
        const timer = setTimeout(() => {
            fetchDashboardData();
        }, 1500)

        return () => clearTimeout(timer)
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch Instances to check connection
            const instances = await api.instances.list().catch(() => []);
            const connectedInstance = instances.find((i: any) => i.status === 'connected' || i.status === 'open');
            const anyInstance = instances[0];

            if (connectedInstance) {
                setInstanceStatus('connected');
            } else if (anyInstance) {
                setInstanceStatus('disconnected');
            } else {
                setInstanceStatus('no_instance');
            }

            // Fetch Campaigns
            const campaigns = await api.campaigns.list().catch(() => []);
            setRecentCampaigns(campaigns.slice(0, 5));

            // Fetch Leads (Contacts)
            const contacts = await api.contacts.getAll().catch(() => []);

            // Fetch Today's Campaigns for the badge
            const today = new Date().toLocaleDateString();
            const campaignsToday = campaigns.filter((c: any) => new Date(c.created_at).toLocaleDateString() === today).length;

            // Calculate simple stats
            setStats({
                leads: contacts.length.toLocaleString(),
                campaigns: campaigns.length.toString(),
                deliveryRate: '100%', // Placeholder for now or calculate from actual message logic if available
                responses: campaignsToday.toString() // Using this for the "+3 hoje" logic
            });
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    }

    const handleConnect = async () => {
        setIsQRModalOpen(true);
        setQrLoading(true);
        setQrCode(null);

        try {
            let instances = await api.instances.list().catch(() => []);
            let instanceId = instances[0]?.id;

            if (!instanceId) {
                // Show modal to ask for instance name
                setShowInstanceNameModal(true);
                setQrLoading(false);
                return;
            }

            const data = await connectToInstance(instanceId);

            if (data.base64) {
                setQrCode(data.base64);
            } else {
                console.error("QR Code not found in response", data);
            }

        } catch (error) {
            console.error("Failed to connect", error);
            setIsQRModalOpen(false);
        } finally {
            setQrLoading(false);
        }
    };

    const connectToInstance = async (instanceId: string) => {
        try {
            const data = await api.instances.connect(instanceId);

            if (data.base64) {
                setQrCode(data.base64);
            } else {
                console.error("QR Code not found in response", data);
            }
            return data;
        } catch (error) {
            console.error("Failed to connect to instance", error);
            throw error;
        }
    };

    const handleInstanceNameSubmit = async (instanceName: string) => {
        try {
            setQrLoading(true);
            setIsQRModalOpen(true); // Open QR modal
            const newInstance = await api.instances.create(instanceName);
            await connectToInstance(newInstance.id);
        } catch (error) {
            console.error("Failed to create instance", error);
            setIsQRModalOpen(false);
        } finally {
            setQrLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <QRCodeModal
                isOpen={isQRModalOpen}
                onClose={() => { setIsQRModalOpen(false); fetchDashboardData(); }}
                qrCode={qrCode}
                isLoading={qrLoading}
                onRetry={handleConnect}
            />


            <InputModal
                isOpen={showInstanceNameModal}
                onClose={() => setShowInstanceNameModal(false)}
                onConfirm={handleInstanceNameSubmit}
                title="Nome da Instância"
                description="Escolha um nome para identificar sua instância do WhatsApp"
                placeholder="Ex: WhatsApp Vendas"
                defaultValue="Minha Instância"
            />

            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                        Seu Hub de<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Automação Imobiliária.</span>
                    </h1>
                    <p className="text-muted-foreground mt-4 text-lg max-w-xl leading-relaxed">
                        Gerencie seus leads, campanhas e automações em um único lugar. O ZapBroker evoluiu para ser o seu centro de comando.
                    </p>
                    <div className="flex gap-3 mt-6">
                        <Link href="/dashboard/campaigns/" className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Nova Campanha
                        </Link>
                        <button className="px-6 py-2.5 bg-accent text-accent-foreground font-bold rounded-xl border border-border hover:bg-accent/80 transition-all">
                            Ajuda
                        </button>
                    </div>
                </div>
            </header>

            {/* Onboarding Checklist */}
            <div data-tour="onboarding-checklist">
                <OnboardingChecklist />
            </div>

            {/* Main Stats Grid - Feature Cards Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* WhatsApp Status Card (Big) */}
                <div className="col-span-1 md:col-span-2 xl:col-span-2 row-span-2">
                    <div data-tour="whatsapp-status" className="h-full">
                        <WhatsAppStatusWidget />
                    </div>
                </div>

                {/* Quota Widget */}
                <div className="xl:col-span-2">
                    <div data-tour="quota-widget" className="h-full">
                        <QuotaWidget />
                    </div>
                </div>

                {/* Leads Card */}
                <div data-tour="stats-leads" className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden h-full min-h-[180px] flex flex-col justify-between">
                    <div className="flex justify-between items-start z-10">
                        <div className="bg-emerald-500/10 p-3 rounded-xl">
                            <Users className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+100%</span>
                    </div>
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-foreground">{stats.leads}</h3>
                        <p className="text-sm text-muted-foreground font-medium">Total de Leads</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                </div>

                {/* Campaigns Card */}
                <div data-tour="stats-campaigns" className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden h-full min-h-[180px] flex flex-col justify-between">
                    <div className="flex justify-between items-start z-10">
                        <div className="bg-purple-500/10 p-3 rounded-xl">
                            <Send className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded-full">+{stats.responses} hoje</span>
                    </div>
                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-foreground">{stats.campaigns}</h3>
                        <p className="text-sm text-muted-foreground font-medium">Campanhas Enviadas</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
                </div>
            </div>

            {/* Recent Section - "New Drops" Style */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary" /> Atividade Recente
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Campaigns List as Cards */}
                    {recentCampaigns.length > 0 ? (
                        recentCampaigns.map((camp) => (
                            <Link
                                key={camp.id}
                                href={`/dashboard/campaigns/${camp.id}`}
                                className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 block h-full"
                            >
                                <div className="aspect-video bg-gradient-to-br from-primary/5 to-purple-500/5 relative p-6 flex flex-col justify-center items-center text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-background shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <span className="text-2xl font-bold text-primary">{camp.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{camp.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(camp.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 border-t border-border bg-card/50 flex justify-between items-center">
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-accent text-muted-foreground uppercase">{camp.status}</span>
                                    <div className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                        Ver detalhes <ArrowUpRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-3xl bg-accent/20">
                            <p className="text-muted-foreground">Nenhuma campanha recente.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
