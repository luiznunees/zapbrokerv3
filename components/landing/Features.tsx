import { Zap, Ghost, Target, MessageSquare, Shield, BarChart3, Mic } from 'lucide-react'
import ScrollAnimation from '@/components/ui/ScrollAnimation'

const features = [
    {
        icon: Mic,
        title: "Comando de Voz via WhatsApp",
        description: "Basta enviar um áudio: 'ZapBroker, dispara a oferta do Leblon pra quem visualizou mês passado'. Ele entende e executa."
    },
    {
        icon: Zap,
        title: "Speed-to-Lead Instantâneo",
        description: "Lead caiu no site? O ZapBroker chama no WhatsApp em 5 segundos, qualifica e agenda a visita se houver interesse."
    },
    {
        icon: MessageSquare,
        title: "Anti-Ghosting Automático",
        description: "O cliente parou de responder? O sistema envia fluxos de reativação naturais, recuperando até 40% dos leads perdidos."
    },
    {
        icon: Target,
        title: "Filtro de Curiosos",
        description: "A IA conversa inicialmente e só passa para você quem realmente tem potencial de compra e orçamento."
    },
    {
        icon: Shield,
        title: "Blindagem de Base",
        description: "Seus dados são seus. Nenhuma imobiliária ou portal tem acesso aos seus leads e conversas."
    },
    {
        icon: BarChart3,
        title: "Dashboards Práticos",
        description: "Sem gráficos complexos. Apenas o que importa: Quantos leads, quantas conversas, quantas visitas agendadas."
    }
]

export default function Features() {
    return (
        <section id="features" className="py-24 bg-accent/20 border-y border-border transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-6">
                <ScrollAnimation animation="fade-up">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
                            Tecnologia para Imobiliárias que não brincam.
                        </h2>
                        <p className="text-muted-foreground">Abandone o amadorismo. Tenha uma máquina de vendas previsível.</p>
                    </div>
                </ScrollAnimation>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <ScrollAnimation key={i} animation="fade-up" delay={i * 100}>
                            <div className="p-6 h-full rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-xl hover:-translate-y-1">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                                    <f.icon className="w-6 h-6 text-primary group-hover:text-primary transition-transform" />
                                </div>
                                <h3 className="text-xl font-semibold text-card-foreground mb-2">{f.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                            </div>
                        </ScrollAnimation>
                    ))}
                </div>
            </div>
        </section>
    )
}
