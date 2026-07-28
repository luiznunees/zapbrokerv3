import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { QuotaService } from '../services/quotaService';
import { supabase } from '../config/supabase';

export const checkQuota = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        const contactListId = req.body.contactListId || req.body.contact_list_id;
        const excludedIds: string[] = req.body.excludedContactIds || [];

        if (!contactListId) {
            return res.status(400).json({ error: 'contactListId é obrigatório' });
        }

        const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan_id, status')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();

        const planId = sub?.plan_id;

        if (!planId) {
            return res.status(403).json({ error: 'Assine um plano para disparar campanhas.' });
        }

        const { count: totalContacts, error: countError } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', contactListId);

        if (countError) {
            console.error('[checkQuota] Error counting contacts:', countError);
            return res.status(500).json({ error: 'Erro ao verificar contatos' });
        }

        const messageCount = Math.max(0, (totalContacts || 0) - excludedIds.length);

        if (messageCount === 0) {
            return res.status(400).json({ error: 'Lista de contatos vazia' });
        }

        // A cota conta campanhas disparadas no mês, não mensagens individuais —
        // dentro de uma campanha, o envio de mensagens é liberado.
        const availability = await QuotaService.checkAvailability(userId, planId, 1);

        if (!availability.available) {
            return res.status(403).json({
                error: 'Cota de campanhas insuficiente',
                available: availability.remaining,
                planLimit: availability.limit,
                message: `Você já usou todas as suas campanhas deste mês (limite: ${availability.limit}). Faça upgrade do seu plano para disparos liberados.`
            });
        }

        (req as any).userPlanId = planId;
        (req as any).quotaCheck = { requested: 1, remaining: availability.remaining };

        next();
    } catch (error) {
        console.error('[checkQuota] Error:', error);
        res.status(500).json({ error: 'Erro ao verificar cota' });
    }
};
