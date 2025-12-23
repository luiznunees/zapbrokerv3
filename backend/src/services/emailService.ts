import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_X4xSeAjc_3P3tAn7SSsCwGnPpyXhzatGF');

export const sendConfirmationEmail = async (email: string, confirmationUrl: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'ZapBroker <onboarding@zapbroker.dev>',
            to: [email],
            subject: 'Confirme seu cadastro no ZapBroker',
            html: `
                <h2>Confirm your signup</h2>
                <p>Follow this link to confirm your user:</p>
                <p><a href="${confirmationUrl}">Confirm your mail</a></p>
            `,
        });

        if (error) {
            console.error('Resend Error (Confirmation):', error);
            throw error;
        }

        console.log('Confirmation email sent to:', email);
        return data;
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
        throw error; // Re-throw so controller knows
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'ZapBroker <onboarding@zapbroker.dev>',
            to: [email],
            subject: 'Bem-vindo ao ZapBroker! 🚀',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1 style="color: #6E29DA;">Bem-vindo(a), ${name}!</h1>
                    <p>Estamos muito felizes em ter você conosco.</p>
                    <p>O <strong>ZapBroker</strong> é a sua nova central de automação. Aqui estão os próximos passos:</p>
                    <ul>
                        <li><a href="https://app.zapbroker.dev/dashboard/settings?tab=connection">Conecte seu WhatsApp</a></li>
                        <li><a href="https://app.zapbroker.dev/dashboard/leads">Importe seus Leads</a></li>
                        <li><a href="https://app.zapbroker.dev/dashboard/campaigns">Crie sua primeira campanha</a></li>
                    </ul>
                    <p>Se precisar de ajuda, responda este email.</p>
                    <p>Abs,<br/>Equipe ZapBroker</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend Error (Welcome):', error);
        }

        console.log('Welcome email sent to:', email);
        return data;
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't throw for welcome email, it's non-critical
    }
};
