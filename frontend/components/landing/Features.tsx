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
        title: "Acompanhe Quem Recebeu",
        description: "Veja no seu WhatsApp quantos leads visualizaram e quantos ainda não responderam."
    }
]

export function Features() {
    return (
        <section id="features" className="relative py-16 md:py-20 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-12">
                    <p className="text-xs font-bold text-landing-sky uppercase tracking-widest mb-2">Como Funciona</p>
                    <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2 text-landing-navy text-balance">
                        O ZapBroker funciona na prática
                    </h2>
                    <p className="text-sm text-landing-navy/60">
                        Tecnologia de ponta simplificada para você focar no que importa: vender imóveis.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                    {FEATURES.map((feature, i) => (
                        <div key={i} className="bg-white border border-landing-navy/10 p-5 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-7 h-7 rounded-full bg-landing-navy text-landing-lime text-xs font-black flex items-center justify-center mb-4">
                                {i + 1}
                            </div>
                            <h3 className="text-sm font-bold mb-1.5 text-landing-navy">{feature.title}</h3>
                            <p className="text-xs text-landing-navy/60 leading-relaxed mb-4">
                                {feature.description}
                            </p>
                            <div className="h-20 rounded-xl bg-landing-mist border border-landing-navy/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <feature.icon className="w-6 h-6 text-landing-sky" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
