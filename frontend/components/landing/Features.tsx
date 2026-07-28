import { Smartphone, MessageSquareText, Send, BellRing } from "lucide-react"
import { DoodleArrowCurl } from "./Doodle"

const FEATURES = [
    {
        icon: Smartphone,
        title: "Conecte em 30 Segundos",
        description: "Escaneie o QR Code e pronto. Não precisa instalar nada, não precisa trocar de chip. Seu número, suas conversas, tudo continua igual."
    },
    {
        icon: MessageSquareText,
        title: "Fale com o Agente, Igual ChatGPT",
        description: "Diga o que você quer em linguagem natural. O agente monta o disparo e escreve a mensagem — você só aprova, edita ou recusa antes de sair."
    },
    {
        icon: Send,
        title: "Disparo pra Lista Inteira",
        description: "Envie pra toda a sua lista de leads de uma vez, imediato ou agendado. Um disparo, qualquer tamanho de lista."
    },
    {
        icon: BellRing,
        title: "Agente Avisa Quem Sumiu",
        description: "Ele acompanha os disparos e te avisa no seu próprio WhatsApp quando um lead não responde, sugerindo um lembrete pra você aprovar."
    }
]

export function Features() {
    return (
        <section id="features" className="relative pt-14 pb-14 md:pt-16 md:pb-16 bg-white rounded-t-[2.5rem] -mt-6 z-10 overflow-hidden">

            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-lg mx-auto mb-10 relative">
                    <DoodleArrowCurl className="hidden md:block absolute -top-6 -left-16 w-14 h-8 text-[#d4a054] rotate-[160deg]" />
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2 text-[#0a0a0a] uppercase">
                        Como o ZapBroker Funciona na Prática?
                    </h2>
                    <p className="text-sm text-[#6f6b76]">
                        Tecnologia de ponta simplificada para você focar no que importa: vender imóveis.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-3 lg:gap-4 max-w-4xl mx-auto">
                    {FEATURES.map((feature, i) => (
                        <div key={i} className="bg-[#f6f4f1] p-5 rounded-3xl hover:shadow-xl hover:-translate-y-1 hover:rotate-1 transition-all duration-300 group">
                            <div className="w-10 h-10 bg-[#145c3b] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <feature.icon className="w-4.5 h-4.5 text-[#d4a054]" />
                            </div>
                            <h3 className="text-base font-black mb-1.5 text-[#0a0a0a]">{feature.title}</h3>
                            <p className="text-sm text-[#6f6b76] leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
