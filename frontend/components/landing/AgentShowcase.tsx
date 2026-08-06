import Link from 'next/link'
import { AgentChatMockup } from './AgentChatMockup'
import { GradientBlobs } from '@/components/auth/AuthFormControls'

export function AgentShowcase() {
    return (
        <section className="py-8 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="relative rounded-3xl bg-gradient-to-br from-primary via-indigo-500 to-primary/60 p-6 md:p-10 grid md:grid-cols-2 gap-8 items-center overflow-hidden">
                    <GradientBlobs />

                    <div className="relative z-10 rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl">
                        <AgentChatMockup />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-xl md:text-3xl font-bold tracking-tight mb-3 text-white leading-tight">
                            O agente cuida do disparo enquanto você atende cliente
                        </h2>
                        <p className="text-sm text-white/80 leading-relaxed mb-5 max-w-md">
                            Você fala o que quer no painel, igual conversa no ChatGPT. O agente monta o disparo, acompanha quem respondeu e te avisa no seu próprio WhatsApp quando algum lead precisa de atenção.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex px-5 py-2.5 rounded-full bg-white hover:bg-white/90 text-primary text-sm font-bold shadow-lg transition-colors"
                        >
                            Testar Gratuitamente →
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
