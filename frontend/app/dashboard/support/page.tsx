"use client"


import { Shield, MessageCircle, Mail } from "lucide-react"

const FAQS = [
    {
        question: "Como conecto meu WhatsApp?",
        answer: "Vá em 'Configurações' > 'Conexão WhatsApp', clique em 'Nova Instância' e depois em 'Conectar' para ler o QR Code com seu celular."
    },
    {
        question: "Posso cancelar a qualquer momento?",
        answer: "Sim! Não temos fidelidade. Você pode cancelar sua assinatura a qualquer momento através da aba 'Assinatura' ou entrando em contato com nosso suporte."
    },
    {
        question: "O que acontece se eu atingir o limite de mensagens?",
        answer: "Seu envio é pausado até a renovação semanal da quota ou até você fazer um upgrade de plano."
    },
    {
        question: "A plataforma funciona com WhatsApp Business?",
        answer: "Sim, funciona tanto com WhatsApp pessoal quanto Business. Recomendamos usar um número Business amadurecido para evitar bloqueios."
    }
]

export default function SupportPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Ajuda & Suporte</h1>
                <p className="text-muted-foreground">Tire suas dúvidas ou entre em contato conosco.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Contact Cards */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <MessageCircle className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold text-lg mb-2">Suporte via WhatsApp</h3>
                    <p className="text-sm text-muted-foreground mb-4">Fale diretamente com nosso time de suporte técnico.</p>
                    <a
                        href="https://wa.me/5511999999999"
                        target="_blank"
                        className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        Iniciar Conversa
                    </a>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <Mail className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold text-lg mb-2">Suporte via Email</h3>
                    <p className="text-sm text-muted-foreground mb-4">Para questões financeiras ou parcerias.</p>
                    <a
                        href="mailto:suporte@zapbroker.dev"
                        className="inline-flex items-center justify-center w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                        Enviar Email
                    </a>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold">Perguntas Frequentes (FAQ)</h2>
                <div className="bg-card border border-border rounded-xl p-6">
                    {/* Simple Accordion Implementation */}
                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                            <details key={i} className="group border-b border-border/50 pb-4 last:border-0 last:pb-0">
                                <summary className="flex cursor-pointer items-center justify-between font-medium hover:text-primary transition-colors list-none">
                                    {faq.question}
                                    <span className="transition-transform group-open:rotate-180">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m6 9 6 6 6-6" /></svg>
                                    </span>
                                </summary>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-2">
                                    {faq.answer}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>

            {/* Refund Policy */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 flex gap-4">
                <Shield className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="space-y-2">
                    <h3 className="font-bold text-foreground">Política de Reembolso</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        De acordo com o Artigo 49 do Código de Defesa do Consumidor, você tem o direito de desistir da compra em até <strong>7 dias corridos</strong> após a confirmação do pagamento.
                        <br /><br />
                        Para solicitar o reembolso, basta entrar em contato com nosso <strong>Suporte via Email ou WhatsApp</strong> informando seu email de cadastro. Nosso time processará o estorno integralmente.
                    </p>
                </div>
            </div>
        </div>
    )
}
