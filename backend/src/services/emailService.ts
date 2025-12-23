import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_X4xSeAjc_3P3tAn7SSsCwGnPpyXhzatGF');

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

export const sendConfirmationEmail = async (email: string, confirmationUrl: string) => {
    try {
        const html = getEmailTemplate(`
            <h1 class="welcome-hero">Confirme seu cadastro 🚀</h1>
            <p>Olá! Você está a um passo de automatizar suas vendas no WhatsApp com o ZapBroker.</p>
            <p>Por favor, clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta:</p>
            <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">Ativar Minha Conta</a>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">Se o botão não funcionar, copie este link: <br/> ${confirmationUrl}</p>
        `);

        const { data, error } = await resend.emails.send({
            from: 'ZapBroker <onboarding@zapbroker.dev>',
            to: [email],
            subject: 'Confirme seu cadastro no ZapBroker',
            html,
        });

        if (error) {
            console.error('Resend Error (Confirmation):', error);
            throw error;
        }

        console.log('Confirmation email sent to:', email);
        return data;
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
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
