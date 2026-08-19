import Link from 'next/link'
import { AgentChatMockup } from './AgentChatMockup'

export function AgentShowcase() {
    return (
        <section className="py-8 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="relative rounded-3xl bg-landing-navy p-6 md:p-10 grid md:grid-cols-2 gap-8 items-center overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-landing-sky/30 blur-3xl" />
                        <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full bg-landing-lime/10 blur-3xl" />
                    </div>

                    <div className="relative z-10 rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl">
                        <AgentChatMockup />
                    </div>

                    <div className="relative z-10">
                        <h2 className="font-display text-xl md:text-3xl font-bold tracking-tight mb-3 text-white leading-tight text-balance">
                            Você fala, o agente monta o disparo
                        </h2>
                        <p className="text-sm text-white/70 leading-relaxed mb-5 max-w-md">
                            Você fala o que quer no painel, igual conversa no ChatGPT. O agente monta o disparo, escreve a mensagem e te avisa no seu próprio WhatsApp quando terminar de enviar.
                        </p>
                        <Link
                            href="/login"
                            className="group inline-flex items-center gap-2 pl-5 pr-2 py-2.5 rounded-full bg-landing-lime hover:bg-landing-lime-dark text-landing-navy text-sm font-bold transition-colors"
                        >
                            Testar agora
                            <span className="flex items-center justify-center size-6 rounded-full bg-landing-navy text-landing-lime group-hover:rotate-45 transition-transform">
                                <svg viewBox="0 0 24 24" fill="none" className="size-3.5"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
