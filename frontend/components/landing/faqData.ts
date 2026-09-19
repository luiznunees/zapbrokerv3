// Dados puros, sem "use client" — importar isso direto de um componente client (FAQ.tsx)
// funciona, mas importar de um componente de SERVIDOR (app/page.tsx, pro schema JSON-LD)
// quebrava o build de produção (RSC não deixa reexportar dado de um módulo client pra um
// módulo server de forma confiável — "FAQ_ITEMS.map is not a function" só no build real,
// invisível no `tsc --noEmit`). Arquivo neutro resolve pros dois lados.
export const FAQ_ITEMS = [
    {
        q: "O ZapBroker é seguro? Vou ser banido?",
        a: "Você conecta seu próprio número via QR Code, do mesmo jeito que conecta no WhatsApp Web. Recomendamos seguir as boas práticas de envio (não disparar volumes muito grandes de uma vez) pra reduzir o risco de bloqueio pela própria Meta."
    },
    {
        q: "A IA realmente personaliza as mensagens?",
        a: "Sim. Você conversa com o agente sobre o disparo — qual imóvel, qual lista, que tom usar — e ele monta a mensagem com você antes de enviar pra toda a lista de uma vez."
    },
    {
        q: "Preciso de conhecimento técnico?",
        a: "Zero. Se você sabe usar WhatsApp, sabe usar ZapBroker. O setup leva menos de 5 minutos: escaneia QR Code, importa contatos e começa a disparar."
    },
    {
        q: "Como funciona o pagamento via PIX?",
        a: "Sua assinatura é cobrada mensalmente via PIX. Você recebe o QR Code direto no painel alguns dias antes do vencimento e paga em segundos, sem cartão de crédito."
    },
    {
        q: "Posso cancelar quando quiser?",
        a: "Sim, sem multas e sem burocracia. Você pode cancelar sua assinatura a qualquer momento diretamente no painel de controle."
    },
    {
        q: "Quanto tempo leva para ativar?",
        a: "Menos de 2 minutos. Você escaneia o QR Code, conecta seu número e já pode criar seu primeiro disparo."
    },
]
