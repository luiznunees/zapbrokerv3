const OBJECTIONS = [
    {
        question: "Vou ter que trocar de chip pra usar?",
        answer: "É o seu WhatsApp normal, do jeito que já tá.",
    },
    {
        question: "É complicado de configurar?",
        answer: "Escaneia um QR Code e já tá pronto — 2 minutos.",
    },
    {
        question: "Vou perder minhas conversas e contatos?",
        answer: "Continua tudo no mesmo número. Nada se apaga.",
    },
    {
        question: "Preciso entender de sistema pra usar?",
        answer: "Você conversa com o agente, igual conversa no ChatGPT.",
    },
]

// Espelha a narrativa do carrossel de ads (QA direta: sempre "Não" + o porquê).
export function AdsLpObjections() {
    return (
        <section className="py-14 md:py-18 bg-white">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="text-center max-w-lg mx-auto mb-10">
                    <p className="text-xs font-bold text-landing-sky uppercase tracking-widest mb-2">Antes de você perguntar</p>
                    <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-landing-navy text-balance">
                        As dúvidas de todo corretor antes de testar
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    {OBJECTIONS.map((o) => (
                        <div key={o.question} className="rounded-2xl bg-landing-navy p-6 flex flex-col justify-between min-h-36">
                            <p className="text-sm md:text-base font-bold text-white mb-4 leading-snug">{o.question}</p>
                            <div>
                                <span className="font-display font-extrabold text-2xl text-landing-lime mr-2 align-middle">Não.</span>
                                <span className="text-sm text-white/70 leading-relaxed">{o.answer}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}