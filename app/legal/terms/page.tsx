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

                <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p>Última atualização: 12 de Dezembro de 2024</p>

                    <h3>1. Aceite dos Termos</h3>
                    <p>Ao acessar e usar o ZapBroker, você concorda com estes termos. Se não concordar, por favor não utilize o serviço.</p>

                    <h3>2. O Serviço</h3>
                    <p>O ZapBroker é uma ferramenta de automação para corretores. Não garantimos vendas, apenas fornecemos as ferramentas para facilitar seu trabalho.</p>

                    <h3>3. Responsabilidades</h3>
                    <p>O usuário é responsável pelo conteúdo das mensagens enviadas. O ZapBroker não tolera Spam e reserva-se o direito de banir contas que violem esta regra.</p>

                    <h3>4. Pagamentos e Cancelamento</h3>
                    <p>O serviço é cobrado mensalmente. Você pode cancelar a qualquer momento através do painel, sem multa.</p>

                    <h3>5. Alterações</h3>
                    <p>Podemos alterar estes termos a qualquer momento, notificando os usuários com antecedência razoável.</p>
                </div>
            </div>
        </div>
    )
}
