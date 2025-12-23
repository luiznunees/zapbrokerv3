import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>

                <h1 className="text-3xl font-bold text-foreground mb-8">Política de Privacidade</h1>

                <div className="prose prose-invert max-w-none text-muted-foreground space-y-6 text-sm">
                    <p>Última atualização: 23 de Dezembro de 2024</p>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">1. Coleta de Dados Pessoais</h3>
                        <p>Coletamos informações estritamente necessárias para a operação da plataforma, incluindo:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Dados Cadastrais:</strong> Nome completo, endereço de e-mail e número de telefone (via Google Auth ou formulário).</li>
                            <li><strong>Dados de Cobrança:</strong> CPF/CNPJ e informações de pagamento processadas de forma segura pelo nosso parceiro AbacatePay.</li>
                            <li><strong>Dados de Uso:</strong> Informações sobre como você interage com a plataforma para fins de melhoria contínua e suporte técnico.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">2. Dados de Terceiros (Leads)</h3>
                        <p>O ZapBroker atua como <strong>Operador de Dados</strong> em relação às listas de contatos importadas pelo usuário. Não acessamos, utilizamos ou compartilhamos os dados de seus leads para qualquer finalidade que não seja o envio das mensagens solicitadas por você.</p>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">3. Compartilhamento de Dados</h3>
                        <p>Não vendemos ou alugamos seus dados pessoais. O compartilhamento ocorre apenas com:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Provedores de infraestrutura (Supabase/Hosters).</li>
                            <li>Gateways de Pagamento (AbacatePay).</li>
                            <li>APIs de comunicação (Evolution API).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">4. Segurança da Informação</h3>
                        <p>Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia de tráfego (SSL) e controles de acesso rigorosos aos bancos de dados.</p>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">5. Contato e Suporte</h3>
                        <p>Para dúvidas sobre privacidade, entre em contato através do e-mail: <span className="text-foreground font-semibold">privacidade@zapbroker.dev</span></p>
                    </section>
                </div>
            </div>
        </div>
    )
}
