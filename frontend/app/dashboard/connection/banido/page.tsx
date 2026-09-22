import Link from 'next/link'
import { ArrowLeft, ShieldAlert, ExternalLink, MessageCircle } from 'lucide-react'

export const metadata = {
    title: 'Meu número foi banido',
}

export default function BanidoGuidePage() {
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Link
                href="/dashboard/connection"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Voltar pra conexão
            </Link>

            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Meu número foi banido — e agora?</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
                O ZapBroker não consegue ver dentro do WhatsApp pra confirmar um banimento — quem sabe
                disso com certeza é o próprio app no seu celular. Esse guia é pra te ajudar a confirmar
                e resolver o mais rápido possível.
            </p>

            <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-bold mb-2">1. Confirme no WhatsApp do celular</h3>
                    <p className="text-sm text-muted-foreground">
                        Abra o WhatsApp normal no aparelho que tem esse número. Se aparecer a mensagem
                        <span className="font-medium text-foreground"> "Esta conta não pode usar o WhatsApp"</span>,
                        o número foi banido de verdade. Se o WhatsApp abrir normal, provavelmente foi só uma
                        queda de conexão — tenta reconectar na tela anterior antes de seguir os próximos passos.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-bold mb-2">2. Peça revisão pelo canal oficial</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        O WhatsApp tem um processo formal de recurso — na própria tela de "conta banida" do
                        app costuma ter um botão pra solicitar revisão. Números recuperáveis já foram
                        reativados assim, mesmo depois de bloqueio por uso de ferramenta não-oficial (não é
                        garantido, mas é a única via de recurso real que existe).
                    </p>
                    <a
                        href="https://faq.whatsapp.com/1114014282925880"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                    >
                        Central de Ajuda do WhatsApp — contas banidas <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-bold mb-2">3. Enquanto isso, no ZapBroker</h3>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li>Seus leads, listas e histórico de campanhas continuam salvos — nada se perde.</li>
                        <li>Conecte um número novo (ou outro chip que você já tenha) na tela de Conexão pra
                            seguir disparando enquanto resolve o número banido.</li>
                        <li>Se o número banido tinha aviso de "risco" ou "atenção" antes de cair, dá uma
                            olhada nesse histórico — ajuda a não repetir o mesmo padrão no número novo.</li>
                    </ul>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
                    <h3 className="font-bold mb-2 text-amber-700">Nenhuma ferramenta garante zero risco</h3>
                    <p className="text-sm text-amber-700/80">
                        Nem o ZapBroker, nem nenhuma outra ferramenta de disparo, consegue garantir que um
                        número nunca vai ser banido — isso depende de decisões do próprio WhatsApp, que não
                        são públicas. O que ajuda de verdade: aquecer o número antes de disparar forte,
                        evitar listas frias em volume alto, e priorizar contatos que já te conhecem.
                    </p>
                </div>

                <div className="text-center pt-2">
                    <a
                        href="https://wa.me/5551994851661?text=Meu%20número%20foi%20banido,%20preciso%20de%20ajuda"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" /> Falar com o suporte do ZapBroker
                    </a>
                </div>
            </div>
        </div>
    )
}
