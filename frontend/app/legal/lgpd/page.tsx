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

                <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o ZapBroker apresenta seu compromisso com a transparência e controle dos dados de seus usuários.</p>

                    <h3>1. Sua Privacidade em Primeiro Lugar</h3>
                    <p>Entendemos que os dados dos seus leads são o seu maior ativo. O ZapBroker atua como <strong>Operador</strong> de dados em seu nome, enquanto você (Corretor/Imobiliária) é o <strong>Controlador</strong>.</p>

                    <h3>2. Coleta e Finalidade</h3>
                    <p>Tratamos dados pessoais estritamente para a execução do contrato de serviço (Art. 7º, V da LGPD):</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Dados de Conta:</strong> Nome, Email, Telefone (para acesso e suporte).</li>
                        <li><strong>Dados de Leads:</strong> Nomes e Telefones importados por você (para envio de mensagens).</li>
                    </ul>

                    <h3>3. Não Vendemos Seus Dados</h3>
                    <p>O ZapBroker não compartilha, vende ou aluga sua lista de contatos ou seus dados pessoais para terceiros para fins de marketing.</p>

                    <h3>4. Seus Direitos</h3>
                    <p>Você tem total controle sobre seus dados:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Exclusão:</strong> Você pode apagar leads ou sua conta a qualquer momento.</li>
                        <li><strong>Exportação:</strong> Seus dados de leads são seus. Você pode exportá-los quando quiser.</li>
                        <li><strong>Revogação:</strong> Você pode desconectar seu WhatsApp a qualquer momento.</li>
                    </ul>

                    <h3>5. Encarregado de Dados (DPO)</h3>
                    <p>Para solicitações relacionadas à privacidade e dados pessoais, entre em contato com nosso Encarregado:</p>
                    <p><strong>Email:</strong> dpo@zapbroker.dev</p>
                </div>
            </div>
        </div>
    )
}
