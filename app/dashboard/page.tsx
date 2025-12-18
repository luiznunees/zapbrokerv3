import { ArrowUpRight, Users, MessageSquare, CheckCircle, Send } from 'lucide-react'

const stats = [
    { name: 'Total de Leads', value: '1,204', change: '+12%', icon: Users },
    { name: 'Campanhas Enviadas', value: '24', change: '+3', icon: Send },
    { name: 'Taxa de Entrega', value: '98.5%', change: '+0.5%', icon: CheckCircle },
    { name: 'Respostas', value: '342', change: '+18%', icon: MessageSquare },
]

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Visão Geral</h1>
                <p className="text-muted-foreground">Bem-vindo de volta, Anderson.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-card border border-border p-6 rounded-xl hover:border-primary/50 transition-colors shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-accent p-2 rounded-lg">
                                <stat.icon className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">{stat.change}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-card-foreground mb-1">{stat.value}</h3>
                        <p className="text-sm text-muted-foreground">{stat.name}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-card-foreground mb-6">Campanhas Recentes</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        L{i}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground">Lançamento Jardins (L{i})</h4>
                                        <p className="text-xs text-muted-foreground">Enviado em 12/12/2025</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-medium text-foreground">450 Envios</span>
                                    <span className="text-xs text-emerald-500">Concluído</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-card-foreground mb-6">Dicas do Dia</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                            <h4 className="font-medium text-secondary-foreground mb-2">Horário Nobre</h4>
                            <p className="text-sm text-muted-foreground">Terça-feira às 10h é o melhor horário para enviar imóveis comerciais.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
