import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>

                <h1 className="text-3xl font-bold text-foreground mb-8">Termos de Uso</h1>

                <div className="prose prose-invert max-w-none text-muted-foreground space-y-6 text-sm">
                    <p>Última atualização: 23 de Dezembro de 2024</p>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">1. Aceite dos Termos</h3>
                        <p>Ao se cadastrar e utilizar a plataforma ZapBroker ("Serviço"), você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Este é um contrato legal entre você (usuário) e o ZapBroker.</p>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">2. Descrição do Serviço</h3>
                        <p>O ZapBroker é uma ferramenta de software como serviço (SaaS) que oferece automação de mensagens via API de terceiros para o aplicativo WhatsApp. O serviço é destinado exclusivamente a corretores de imóveis e profissionais do setor imobiliário para fins de gestão de relacionamento e marketing direto.</p>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">3. Planos e Faturamento</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Ciclo de Cobrança:</strong> Todos os planos são faturados em ciclos de 30 (trinta) dias de forma recorrente.</li>
                            <li><strong>Cotas de Mensagens:</strong> A liberação de mensagens é processada semanalmente, de acordo com o limite do plano contratado. Mensagens não utilizadas em uma semana não são cumulativas para a semana seguinte.</li>
                            <li><strong>Upgrade/Downgrade:</strong> Alterações de plano podem ser feitas a qualquer momento, sendo aplicadas pro-rata ou no próximo ciclo dependendo da configuração do gateway de pagamento.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">4. Política Anti-Spam e Uso Responsável</h3>
                        <p>O ZapBroker proíbe estritamente o uso da plataforma para envio de Spam. O usuário declara estar ciente de que:</p>
                        <ul className="list-disc pl-5 space-y-2 font-semibold text-foreground/90">
                            <li>É proibido o envio de mensagens para contatos que não deram consentimento prévio (Opt-in).</li>
                            <li>O uso excessivo que resulte em banimento da conta do WhatsApp pelo Meta (WhatsApp Inc.) é de inteira responsabilidade do usuário.</li>
                            <li>O ZapBroker não se responsabiliza por bloqueios de contas de terceiros resultantes do uso da ferramenta.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">5. Limitação de Responsabilidade</h3>
                        <p>A plataforma é fornecida "como está". Não garantimos volume de vendas, conversão de leads ou disponibilidade 100% ininterrupta das APIs de terceiros (WhatsApp/Evolution API).</p>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">6. Rescisão</h3>
                        <p>O usuário pode cancelar a assinatura a qualquer momento através do painel de controle. O acesso permanecerá ativo até o final do período já pago.</p>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">7. Contato</h3>
                        <p>Dúvidas sobre estes termos devem ser enviadas para: <span className="text-foreground font-semibold">suporte@zapbroker.dev</span></p>
                    </section>
                </div>
            </div>
        </div>
    )
}
