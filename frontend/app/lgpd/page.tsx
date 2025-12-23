import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LGPDPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>

                <h1 className="text-3xl font-bold text-foreground mb-8">LGPD e Proteção de Dados</h1>

                <div className="prose prose-invert max-w-none text-muted-foreground space-y-6 text-sm">
                    <p>Em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018), o ZapBroker reafirma seu compromisso com a transparência e a segurança no tratamento de dados pessoais.</p>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">1. Papéis no Tratamento de Dados</h3>
                        <p>Para fins da LGPD, o tratamento de dados no ZapBroker ocorre da seguinte forma:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Controlador:</strong> Você (Corretor/Imobiliária), que decide quais contatos importar e quais mensagens enviar.</li>
                            <li><strong>Operador:</strong> O ZapBroker, que processa os dados estritamente conforme suas instruções técnicas dentro da plataforma.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">2. Direitos dos Titulares</h3>
                        <p>Garantimos a você e aos seus leads (através de suas solicitações) os direitos previstos no Artigo 18 da LGPD:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Confirmação da existência de tratamento.</li>
                            <li>Acesso, correção ou exclusão de dados incompletos ou inexatos.</li>
                            <li>Portabilidade dos dados para outro fornecedor de serviço.</li>
                            <li>Revogação do consentimento (através da exclusão da conta).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">3. Bases Legais</h3>
                        <p>O ZapBroker trata dados pessoais baseando-se em:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Execução de Contrato:</strong> Para fornecer as ferramentas de automação contratadas.</li>
                            <li><strong>Legítimo Interesse:</strong> Para melhoria da segurança e funcionalidades do software.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">4. Retenção de Dados</h3>
                        <p>Os dados são mantidos apenas enquanto a assinatura estiver ativa. Após o cancelamento e encerramento do ciclo, os dados de leads e histórico de mensagens são anonimizados ou excluídos definitivamente de nossos backups em até 30 dias.</p>
                    </section>

                    <section>
                        <h3 className="text-foreground font-bold text-lg mb-2">5. Encarregado de Proteção de Dados (DPO)</h3>
                        <p>Nossa equipe de privacidade atua como ponto de contato para a ANPD e titulares. Contato: <span className="text-foreground font-semibold">dpo@zapbroker.dev</span></p>
                    </section>
                </div>
            </div>
        </div>
    )
}
