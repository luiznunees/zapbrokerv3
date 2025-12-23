import { Smartphone, Brain, Zap, BarChart3 } from "lucide-react"

const FEATURES = [
    {
        icon: Smartphone,
        title: "Conecte em 30 Segundos",
        description: "Escaneie QR Code e pronto. Não precisa instalar nada, não precisa trocar de chip. Seu número, suas conversas, tudo continua igual."
    },
    {
        icon: Brain,
        title: "IA Personaliza Cada Mensagem",
        description: "Nossa inteligência artificial cria mensagens únicas baseadas no perfil de cada lead: nome, bairro, tipo de imóvel. Taxa de resposta 3x maior."
    },
    {
        icon: Zap,
        title: "Dispare 500+ Mensagens/Dia",
        description: "Sistema anti-ban profissional. Delay inteligente, aquecimento gradual, volume controlado. 1.247 corretores usando, 0 banimentos."
    },
    {
        icon: BarChart3,
        title: "Acompanhe Resultados",
        description: "Veja quantas mensagens foram entregues, lidas, respondidas. Saiba qual campanha traz mais exclusivas e fechamentos."
    }
]

export function Features() {
    return (
        <section id="features" className="py-8 md:py-10 bg-background relative overflow-hidden">

            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-6">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                        Como o ZapBroker Funciona na Prática?
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Tecnologia de ponta simplificada para você focar no que importa: vender imóveis.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-2 lg:gap-3 max-w-4xl mx-auto">
                    {FEATURES.map((feature, i) => (
                        <div key={i} className="bg-card border border-border p-3 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-7 h-7 bg-brand-purple-100 dark:bg-brand-purple-900/30 rounded-md flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                <feature.icon className="w-3.5 h-3.5 text-brand-purple-600 dark:text-brand-purple-400" />
                            </div>
                            <h3 className="text-sm font-bold mb-1">{feature.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
