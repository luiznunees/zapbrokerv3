import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as feedbackService from '../services/feedbackService';
import { notifyAdmins } from '../services/pushService';
import * as eventLogService from '../services/eventLogService';

// Rota pública (sem authenticateToken) — o tester pode não estar logado, e não
// queremos nenhuma fricção entre ele querer reclamar/elogiar e conseguir enviar.
export const submitFeedback = async (req: Request, res: Response) => {
    try {
        const {
            name, email, overallRating, easeRating,
            liked, confusing, hadError, errorDescription, improvements, pageUrl,
        } = req.body;

        if (!overallRating && !liked && !confusing && !improvements && !errorDescription) {
            return res.status(400).json({ error: 'Feedback vazio.' });
        }

        // Se o token existir e for válido, anexa o user_id — mas nunca bloqueia o envio por isso.
        let userId: string | null = null;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const { supabase } = await import('../config/supabase');
                const { data } = await supabase.auth.getUser(authHeader.slice(7));
                userId = data?.user?.id || null;
            } catch {
                // token ausente/expirado — segue sem user_id
            }
        }

        const feedback = await feedbackService.createFeedback({
            userId,
            name,
            email,
            overallRating,
            easeRating,
            liked,
            confusing,
            hadError,
            errorDescription,
            improvements,
            pageUrl,
            userAgent: req.headers['user-agent'],
        });

        eventLogService.logEvent({
            type: 'beta.feedback_submitted',
            severity: 'info',
            message: `Feedback recebido${overallRating ? ` (nota ${overallRating})` : ''}${hadError ? ' — relatou erro' : ''}`,
            userId,
            metadata: { feedbackId: feedback.id, overallRating, hadError },
        });

        notifyAdmins({
            title: '📝 Novo feedback do beta',
            body: overallRating
                ? `Nota ${overallRating}${hadError ? ' · relatou erro' : ''} — ${(liked || improvements || confusing || 'sem comentário').slice(0, 80)}`
                : (liked || confusing || improvements || errorDescription || 'Novo feedback recebido').slice(0, 100),
            url: '/admin/feedback',
        }).catch(() => {});

        res.status(201).json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const listFeedback = async (req: AuthRequest, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;
        const result = await feedbackService.getFeedback(page, limit);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
