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

                <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p>Última atualização: 12 de Dezembro de 2024</p>

                    <h3>1. Coleta de Dados</h3>
                    <p>Nós coletamos informações mínimas necessárias para o funcionamento do serviço, incluindo Nome, Email e Telefone fornecidos no cadastro.</p>

                    <h3>2. Uso das Informações</h3>
                    <p>Seus dados são usados exclusivamente para: (a) Prestação do serviço contratado; (b) Comunicação sobre atualizações; (c) Melhoria da plataforma.</p>

                    <h3>3. Segurança</h3>
                    <p>Utilizamos criptografia de ponta a ponta e servidores seguros para proteger suas informações contra acesso não autorizado.</p>

                    <h3>4. Seus Direitos</h3>
                    <p>Você tem direito a acessar, corrigir ou deletar seus dados a qualquer momento. Basta entrar em contato com nosso suporte.</p>

                    <h3>5. Contato</h3>
                    <p>Dúvidas? Envie um email para atendimento@zapbroker.dev</p>
                </div>
            </div>
        </div>
    )
}
