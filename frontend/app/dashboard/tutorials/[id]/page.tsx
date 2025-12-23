"use client"

import { ArrowLeft, Calendar, User, Clock, Share2, Printer } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// In a real app, this would come from a database or CMS/Markdown files
const TUTORIAL_CONTENT: Record<string, any> = {
    "1": {
        title: "Como criar sua primeira campanha",
        category: "Campanhas",
        date: "20 Dez, 2024",
        author: "Time ZapBroker",
        content: `
            <p class="mb-4">Enviar mensagens em massa pelo WhatsApp é uma das formas mais eficientes de contatar leads frios ou fazer remarketing. Neste tutorial, vamos te guiar passo a passo para criar sua primeira campanha no ZapBroker.</p>

            <h3 class="text-xl font-bold mt-8 mb-4">1. Preparando sua lista de contatos</h3>
            <p class="mb-4">Antes de tudo, você precisa de uma lista de contatos. O formato ideal é um arquivo CSV contendo pelo menos as colunas <strong>Nome</strong> e <strong>Telefone</strong>. Certifique-se de que os números incluam o código do país (55) e o DDD.</p>

            <h3 class="text-xl font-bold mt-8 mb-4">2. Criando a campanha</h3>
            <p class="mb-4">No menu lateral, clique em <strong>Campanhas</strong> e depois no botão <strong>Nova Campanha</strong>.</p>
            <ul class="list-disc pl-6 space-y-2 mb-6">
                <li>Dê um nome para sua campanha (ex: "Oferta Lançamento X").</li>
                <li>Selecione a instância (chip) que fará os envios.</li>
                <li>Defina o intervalo entre as mensagens. Recomendamos <strong>20 a 40 segundos</strong> para evitar bloqueios.</li>
            </ul>

            <h3 class="text-xl font-bold mt-8 mb-4">3. Escrevendo a mensagem</h3>
            <p class="mb-4">Utilize variáveis para personalizar a mensagem. O ZapBroker permite usar <code>{nome}</code> para substituir automaticamente pelo nome do cliente.</p>
            <div class="bg-muted p-4 rounded-lg my-4 font-mono text-sm">
                Olá {nome}, tudo bem?<br/>
                Vi que você procurou imóveis na região da Pampulha recentemente...
            </div>

            <h3 class="text-xl font-bold mt-8 mb-4">4. Disparo e Acompanhamento</h3>
            <p class="mb-4">Após configurar tudo, clique em <strong>Agendar</strong> ou <strong>Enviar Agora</strong>. Você poderá acompanhar o status de cada envio em tempo real na aba de Campanhas.</p>
        `
    },
    "2": {
        title: "Cadastrando imóveis e leads",
        category: "Gestão",
        date: "18 Dez, 2024",
        author: "Suporte",
        content: `
            <p class="mb-4">Manter sua base organizada é fundamental. Veja como cadastrar leads e imóveis manualmente na plataforma.</p>

            <h3 class="text-xl font-bold mt-8 mb-4">Cadastrando Leads</h3>
            <p class="mb-4">Acesse o menu <strong>Leads (Kanban)</strong>. No canto superior direito, clique em <strong>Novo Lead</strong>.</p>
            <p class="mb-4">Preencha as informações básicas:</p>
            <ul class="list-disc pl-6 space-y-2 mb-6">
                <li>Nome Completo</li>
                <li>WhatsApp (Crucial para contato)</li>
                <li>Email (Opcional)</li>
                <li>Interesse (Compra/Aluguel)</li>
            </ul>

            <h3 class="text-xl font-bold mt-8 mb-4">Integração Automática</h3>
            <p class="mb-4">Você também pode receber leads automaticamente do seu site ou portais imobiliários. Para isso, vá em <strong>Configurações > Integrações</strong> e configure o Webhook do ZapBroker na sua ferramenta de origem.</p>
        `
    },
    "3": {
        title: "Melhores práticas do WhatsApp",
        category: "Dicas",
        date: "15 Dez, 2024",
        author: "Especialista em Zap",
        content: `
            <p class="mb-4">O WhatsApp possui sistemas rigorosos contra spam. Siga estas dicas para manter seu número seguro e evitar o temido banimento.</p>

            <h3 class="text-xl font-bold mt-8 mb-4">1. Aqueça seu chip (Maturação)</h3>
            <p class="mb-4">Nunca pegue um chip novo e comece a disparar 1.000 mensagens. Use o chip normalmente por 1 ou 2 semanas, converse com amigos, entre em grupos, antes de usar para marketing massivo.</p>

            <h3 class="text-xl font-bold mt-8 mb-4">2. Use variáveis na mensagem</h3>
            <p class="mb-4">O algoritmo do WhatsApp detecta mensagens idênticas enviadas repetidamente. Use a variável <code>{nome}</code> e varie a saudação (Oi, Olá, Tudo bem) para tornar cada mensagem única.</p>

            <h3 class="text-xl font-bold mt-8 mb-4">3. Respeite os intervalos</h3>
            <p class="mb-4">A pressa é inimiga da perfeição. Configure intervalos de envio aleatórios entre 30 e 120 segundos. O ZapBroker já faz isso automaticamente para você se configurar corretamente na campanha.</p>

            <div class="bg-red-500/10 border-l-4 border-red-500 p-4 my-6">
                <strong>Atenção:</strong> Se muitos usuários bloquearem ou denunciarem seu número, o banimento é quase certo. Envie conteúdo relevante!
            </div>
        `
    },
    "4": {
        title: "Usando o Kanban de Leads",
        category: "CRM",
        date: "10 Dez, 2024",
        author: "Time Produto",
        content: `
            <p class="mb-4">O visual Kanban (colunas) é perfeito para visualizar o funil de vendas dos seus corretores. Entenda como funciona cada etapa.</p>

            <h3 class="text-xl font-bold mt-8 mb-4">As Colunas Padrão</h3>
            <ul class="list-disc pl-6 space-y-2 mb-6">
                <li><strong>Novos:</strong> Leads que acabaram de chegar e ainda não tiveram contato.</li>
                <li><strong>Em Atendimento:</strong> Conversa iniciada, levantamento de necessidades.</li>
                <li><strong>Visita Agendada:</strong> Quando o cliente topou ver um imóvel.</li>
                <li><strong>Proposta:</strong> Cliente gostou e enviou proposta.</li>
                <li><strong>Fechamento:</strong> Documentação e contrato.</li>
            </ul>

            <h3 class="text-xl font-bold mt-8 mb-4">Movendo Cards</h3>
            <p class="mb-4">Basta clicar e arrastar o card do cliente de uma coluna para outra. Ao fazer isso, o sistema salva automaticamente o novo status.</p>
        `
    }
}

export default function TutorialDetailPage() {
    const params = useParams()
    const id = params?.id as string
    const tutorial = TUTORIAL_CONTENT[id]

    if (!tutorial) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Tutorial não encontrado 😕</h2>
                <Link href="/dashboard/tutorials" className="text-primary hover:underline">
                    Voltar para a lista
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
            <Link
                href="/dashboard/tutorials"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Voltar para tutoriais
            </Link>

            <article>
                <header className="mb-8 border-b border-border pb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                            {tutorial.category}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" /> 5 min leitura
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
                        {tutorial.title}
                    </h1>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">{tutorial.author}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {tutorial.date}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors" title="Compartilhar">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors" title="Imprimir">
                                <Printer className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <div
                    className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: tutorial.content }}
                />
            </article>

            <div className="mt-12 pt-8 border-t border-border">
                <div className="bg-primary/5 rounded-2xl p-8 text-center">
                    <h3 className="text-xl font-bold mb-2">Gostou deste tutorial?</h3>
                    <p className="text-muted-foreground mb-6">Veja outros guias para dominar o ZapBroker.</p>
                    <Link
                        href="/dashboard/tutorials"
                        className="inline-block px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Ver mais tutoriais
                    </Link>
                </div>
            </div>
        </div>
    )
}
