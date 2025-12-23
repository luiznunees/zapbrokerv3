import { Request, Response } from 'express';
import * as instanceService from '../services/instanceService';
import { AuthRequest } from '../middlewares/authMiddleware';

import { supabase } from '../config/supabase';
import { PLAN_LIMITS, DEFAULT_LIMITS } from '../config/limits';

export const create = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        // 1. Check User's Plan
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_id, status')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        const planId = subscription?.plan_id;
        const limits = planId ? PLAN_LIMITS[planId] : DEFAULT_LIMITS;

        if (!limits) {
            // Should not happen if subscription is active, but fallback
            throw new Error('Invalid plan configuration');
        }

        // 2. Count Existing Instances
        const { count, error: countError } = await supabase
            .from('instances')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) throw new Error(countError.message);

        if ((count || 0) >= limits.maxInstances) {
            return res.status(403).json({
                error: `Plan limit reached. Your plan allows ${limits.maxInstances} instance(s). Upgrade to add more.`
            });
        }

        const result = await instanceService.createInstance(userId, name);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const connect = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await instanceService.connectInstance(userId, id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const list = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const result = await instanceService.getInstances(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const remove = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await instanceService.deleteInstance(userId, id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const logout = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await instanceService.logoutInstance(userId, id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
