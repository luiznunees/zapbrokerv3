import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

if (!resend) {
    console.warn('RESEND_API_KEY not configured — emails will not be sent');
}

const BRAND_COLOR = '#6E29DA';
const SECONDARY_COLOR = '#10B981';

const getEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: ${BRAND_COLOR}; padding: 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 24px; font-weight: bold; text-decoration: none; letter-spacing: -0.5px; }
        .content { padding: 40px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #999; background: #f8f9fa; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .welcome-hero { font-size: 28px; color: #333; margin-bottom: 20px; font-weight: 800; }
        .footer-links a { color: #999; margin: 0 10px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://zapbroker.dev" class="logo">ZAPBROKER</a>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ZapBroker. Automando o sucesso de corretores.</p>
            <div class="footer-links">
                <a href="https://zapbroker.dev/privacy">Privacidade</a>
                <a href="https://zapbroker.dev/terms">Termos</a>
            </div>
        </div>
    </div>
</body>
</html>
`;

export const sendPaymentReminderEmail = async (email: string, name: string, checkoutUrl: string) => {
    if (!resend) { console.warn('Resend not configured, skipping payment reminder email to', email); return; }
    try {
        const html = getEmailTemplate(`
            <h1 class="welcome-hero">Hora de renovar seu PIX 💜</h1>
            <p>Olá, ${name}! Sua assinatura do ZapBroker está próxima do vencimento.</p>
            <p>Para continuar automatizando suas vendas sem interrupção, pague o PIX abaixo:</p>
            <div style="text-align: center;">
                <a href="${checkoutUrl}" class="button">Pagar com PIX</a>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">Se o botão não funcionar, copie este link: <br/> ${checkoutUrl}</p>
        `);

        const { data, error } = await resend.emails.send({
            from: 'ZapBroker <onboarding@zapbroker.dev>',
            to: [email],
            subject: 'Renove sua assinatura ZapBroker (PIX)',
            html,
        });

        if (error) console.error('Resend Error (Payment Reminder):', error);
        console.log('Payment reminder email sent to:', email);
        return data;
    } catch (error) {
        console.error('Failed to send payment reminder email:', error);
    }
};

// Pagamento do ciclo (assinatura nova ou renovação) confirmado — recibo simples pro cliente.
export const sendPaymentConfirmedEmail = async (email: string, name: string, planName: string, amount: number, nextBillingDate: Date) => {
    if (!resend) { console.warn('Resend not configured, skipping payment confirmed email to', email); return; }
    try {
        const formattedAmount = (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formattedDate = nextBillingDate.toLocaleDateString('pt-BR');
        const html = getEmailTemplate(`
            <h1 class="welcome-hero">Pagamento confirmado! ✅</h1>
            <p>Olá, ${name}! Recebemos seu PIX e sua assinatura do ZapBroker está ativa.</p>
            <div style="margin: 20px 0; background: #f0fdf4; padding: 20px; border-radius: 12px; border-left: 4px solid ${SECONDARY_COLOR};">
                <p style="margin: 0 0 8px;"><strong>Plano:</strong> ${planName}</p>
                <p style="margin: 0 0 8px;"><strong>Valor pago:</strong> ${formattedAmount}</p>
                <p style="margin: 0;"><strong>Próxima renovação:</strong> ${formattedDate}</p>
            </div>
            <p>Aproveite pra continuar automatizando suas vendas no WhatsApp. Qualquer dúvida, é só responder este e-mail.</p>
        `);

        const { data, error } = await resend.emails.send({
            from: 'ZapBroker <onboarding@zapbroker.dev>',
            to: [email],
            subject: 'Pagamento confirmado — ZapBroker',
            html,
        });

        if (error) console.error('Resend Error (Payment Confirmed):', error);
        return data;
    } catch (error) {
        console.error('Failed to send payment confirmed email:', error);
    }
};

// Assinatura passou da carência sem pagar — acesso já foi cortado (ver monthlyBilling.ts),
// esse email avisa o cliente e dá o link pra regularizar.
export const sendSubscriptionOverdueEmail = async (email: string, name: string, checkoutUrl: string) => {
    if (!resend) { console.warn('Resend not configured, skipping overdue email to', email); return; }
    try {
        const html = getEmailTemplate(`
            <h1 class="welcome-hero" style="color: #dc2626;">Sua assinatura está atrasada ⚠️</h1>
            <p>Olá, ${name}! Não recebemos o pagamento do seu PIX dentro do prazo, e seu acesso ao ZapBroker foi pausado.</p>
            <p>Pra reativar agora, é só pagar o PIX abaixo:</p>
            <div style="text-align: center;">
                <a href="${checkoutUrl}" class="button">Regularizar Pagamento</a>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">Se o botão não funcionar, copie este link: <br/> ${checkoutUrl}</p>
        `);

        const { data, error } = await resend.emails.send({
            from: 'ZapBroker <onboarding@zapbroker.dev>',
            to: [email],
            subject: 'Sua assinatura ZapBroker está atrasada',
            html,
        });

        if (error) console.error('Resend Error (Overdue):', error);
        return data;
    } catch (error) {
        console.error('Failed to send overdue email:', error);
    }
};

// Cliente cancelou a assinatura — confirmação, sem tentar reverter a decisão no email.
export const sendSubscriptionCancelledEmail = async (email: string, name: string) => {
    if (!resend) { console.warn('Resend not configured, skipping cancellation email to', email); return; }
    try {
        const html = getEmailTemplate(`
            <h1 class="welcome-hero">Assinatura cancelada</h1>
            <p>Olá, ${name}. Confirmamos o cancelamento da sua assinatura do ZapBroker — você continua com acesso até o fim do período já pago.</p>
            <p>Se mudar de ideia, é só assinar de novo quando quiser: <a href="https://zapbroker.dev/dashboard/settings" style="color: ${BRAND_COLOR}">acessar configurações</a>.</p>
            <p>Se cancelou por algum problema que a gente poderia ter resolvido, responde este e-mail — a gente quer saber.</p>
        `);

        const { data, error } = await resend.emails.send({
            from: 'ZapBroker <onboarding@zapbroker.dev>',
            to: [email],
            subject: 'Confirmamos o cancelamento da sua assinatura',
            html,
        });

        if (error) console.error('Resend Error (Cancellation):', error);
        return data;
    } catch (error) {
        console.error('Failed to send cancellation email:', error);
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    if (!resend) { console.warn('Resend not configured, skipping welcome email to', email); return; }
    try {
        const html = getEmailTemplate(`
            <h1 class="welcome-hero">Bem-vindo(a), ${name}! 💜</h1>
            <p>Estamos muito felizes em ter você conosco como parceiro(a) do ZapBroker.</p>
            <p>Nossa missão é te dar superpoderes no WhatsApp. Aqui estão os seus primeiros passos:</p>
            
            <div style="margin: 30px 0; background: #f3f0ff; padding: 20px; border-radius: 12px; border-left: 4px solid ${BRAND_COLOR};">
                <ul style="list-style: none; padding: 0; margin: 0; space-y: 10px;">
                    <li style="margin-bottom: 15px;">✅ <strong>Conecte seu WhatsApp:</strong> <br/><a href="https://zapbroker.dev/dashboard/settings?tab=connection" style="color: ${BRAND_COLOR}">Acessar Configurações</a></li>
                    <li style="margin-bottom: 15px;">📈 <strong>Importe seus Leads:</strong> <br/><a href="https://zapbroker.dev/dashboard/leads" style="color: ${BRAND_COLOR}">Ir para o Kanban</a></li>
                    <li style="margin-bottom: 0;">🚀 <strong>Primeira Campanha:</strong> <br/><a href="https://zapbroker.dev/dashboard/campaigns" style="color: ${BRAND_COLOR}">Criar Disparo</a></li>
                </ul>
            </div>

            <p>Dica: Comece conectando seu chip e enviando uma mensagem de teste para você mesmo(a) para sentir a mágica acontecer.</p>
            <p>Se precisar de qualquer ajuda, basta responder este e-mail.</p>
            <p>Boas vendas!<br/><strong>Time ZapBroker</strong></p>
        `);

        const { data, error } = await resend.emails.send({
            from: 'ZapBroker <onboarding@zapbroker.dev>',
            to: [email],
            subject: 'Welcome to the Future of Real Estate 🚀',
            html,
        });

        if (error) {
            console.error('Resend Error (Welcome):', error);
        }

        console.log('Welcome email sent to:', email);
        return data;
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }
};
