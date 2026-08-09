import { QrCode, ListChecks, Bell } from "lucide-react"

const STEPS = [
    {
        icon: QrCode,
        step: "1",
        title: "Conecta seu WhatsApp",
        desc: "Escaneia um QR Code (ou usa código de pareamento se tiver no celular). Leva menos de 2 minutos, sem trocar de chip.",
    },
    {
        icon: ListChecks,
        step: "2",
        title: "Importa sua carteira",
        desc: "Sobe sua lista de clientes e o ZapBroker já organiza quem respondeu, quem sumiu e quem tá esperando retorno.",
    },
    {
        icon: Bell,
        step: "3",
        title: "Dispara pra carteira inteira",
        desc: "Manda a mesma mensagem (ou variações) pra toda a carteira de uma vez, no ritmo que você define.",
    },
]

export function LpHowItWorks() {
    return (
        <section className="py-14 md:py-18 bg-landing-mist">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="text-center max-w-lg mx-auto mb-10">
                    <p className="text-xs font-bold text-landing-sky uppercase tracking-widest mb-2">Como funciona</p>
                    <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-landing-navy text-balance">
                        Do jeito que você já usa o WhatsApp, só que sem esquecer ninguém
                    </h2>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    {STEPS.map((s) => (
                        <div key={s.step} className="relative rounded-2xl bg-white border border-landing-navy/10 p-5">
                            <span className="absolute -top-3 -left-2 flex items-center justify-center size-7 rounded-full bg-landing-navy text-landing-lime text-xs font-black">
                                {s.step}
                            </span>
                            <s.icon className="w-6 h-6 text-landing-sky mb-3 mt-2" />
                            <h3 className="font-bold text-sm text-landing-navy mb-1.5">{s.title}</h3>
                            <p className="text-sm text-landing-navy/60 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
