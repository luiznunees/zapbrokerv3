import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { QuotaService } from '../services/quotaService';
import { supabase } from '../config/supabase';

export const checkQuota = async (req: AuthRequest, res: Response, next: NextFunction) => {
    /* 
    Temporary Bypass for Dev Mode
    */
    return next();

    /*
    try {
        const userId = req.user.id;
        // ... (rest of logic commented out)
    } catch (error) {
        console.error('[checkQuota] Error:', error);
        res.status(500).json({ error: 'Error checking quota' });
    }
    */
};
