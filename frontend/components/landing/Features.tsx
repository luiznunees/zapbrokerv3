import { QrCode, MessageSquareText, ListChecks, BellRing } from "lucide-react"

const FEATURES = [
    {
        icon: QrCode,
        title: "Conecte em 30 Segundos",
        description: "Escaneie o QR Code e pronto. Não precisa instalar nada, não precisa trocar de chip."
    },
    {
        icon: MessageSquareText,
        title: "Fale com o Agente",
        description: "Diga o que você quer em linguagem natural. O agente monta o disparo e escreve a mensagem."
    },
    {
        icon: ListChecks,
        title: "Disparo pra Lista Inteira",
        description: "Envie pra toda a sua lista de leads de uma vez, imediato ou agendado. Qualquer tamanho de lista."
    },
    {
        icon: BellRing,
        title: "Agente Avisa Quem Sumiu",
        description: "Ele acompanha os disparos e te avisa no seu WhatsApp quando um lead não responde, sugerindo um lembrete."
    }
]

export function Features() {
    return (
        <section id="features" className="relative py-14 md:py-16 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-10">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Como Funciona</p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-foreground">
                        O ZapBroker Funciona na Prática
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Tecnologia de ponta simplificada para você focar no que importa: vender imóveis.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                    {FEATURES.map((feature, i) => (
                        <div key={i} className="bg-white border border-border p-5 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center mb-4">
                                {i + 1}
                            </div>
                            <h3 className="text-sm font-bold mb-1.5 text-foreground">{feature.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                {feature.description}
                            </p>
                            <div className="h-20 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <feature.icon className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
