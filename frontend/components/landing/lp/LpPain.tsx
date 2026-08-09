import { Clock3, MessageCircleX, FolderX } from "lucide-react"

const PAINS = [
    {
        icon: Clock3,
        title: "Você demora a responder",
        desc: "Entre um plantão e outro, o lead manda mensagem, ninguém responde na hora, e ele já tá conversando com outro corretor.",
    },
    {
        icon: FolderX,
        title: "Lead se perde na lista",
        desc: "Sem um jeito de ver quem ainda não teve retorno, é fácil esquecer justamente o lead mais quente.",
    },
    {
        icon: MessageCircleX,
        title: "Follow-up não acontece",
        desc: "Você sabe que devia mandar aquele lembrete depois da visita, mas o dia corre e a mensagem nunca sai.",
    },
]

export function LpPain() {
    return (
        <section className="py-14 md:py-18 bg-white">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="text-center max-w-lg mx-auto mb-10">
                    <p className="text-xs font-bold text-landing-sky uppercase tracking-widest mb-2">O problema não é falta de lead</p>
                    <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-landing-navy text-balance">
                        É o que acontece depois que ele chega no seu WhatsApp
                    </h2>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    {PAINS.map((pain, i) => (
                        <div key={i} className="rounded-2xl bg-landing-mist p-5">
                            <pain.icon className="w-6 h-6 text-landing-sky mb-3" />
                            <h3 className="font-bold text-sm text-landing-navy mb-1.5">{pain.title}</h3>
                            <p className="text-sm text-landing-navy/60 leading-relaxed">{pain.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
