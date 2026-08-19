import cron from 'node-cron';
import { sendReengagement } from '../services/reengagementService';

// Re-engajamento: diariamente, notifica quem está inativo há 7, 14 e 30 dias.
// Cada usuário recebe no máximo 1 push a cada 7 dias (rate limit no service).
export function startReengagementJob() {
    cron.schedule('0 7 * * *', async () => {
        try {
            console.log('[CRON] Rodando re-engajamento...');
            await sendReengagement(7);
            await sendReengagement(14);
            await sendReengagement(30);
        } catch (error) {
            console.error('[CRON] Erro no re-engajamento:', error);
        }
    }, { timezone: 'America/Sao_Paulo' });

    console.log('[CRON] Re-engajamento (push) agendado (diário 07:00 BRT)');
}