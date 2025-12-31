import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { supabase } from '../config/supabase';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.user.id;

        // Check role in public.users
        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !user) {
            console.error('[AdminMiddleware] Error fetching user role:', error);
            return res.status(403).json({ error: 'Access denied' });
        }

        if (user.role !== 'admin') {
            console.warn(`[AdminMiddleware] User ${userId} attempted admin access without permission.`);
            return res.status(403).json({ error: 'Admin privileges required' });
        }

        next();
    } catch (error) {
        console.error('[AdminMiddleware] Unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
