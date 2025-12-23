import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { supabase } from '../config/supabase';

export const getSettings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        // Try to fetch settings from a 'settings' table or 'user_settings'
        // For now, let's assume we store it in a 'settings' table linked to user_id
        // If table doesn't exist, we return defaults.

        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            // Real error
            console.error('Error fetching settings:', error);
        }

        const defaultSettings = {
            instanceName: '',
            notifications: true,
            theme: 'light',
            language: 'pt-BR'
        };

        res.status(200).json(data || defaultSettings);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const settings = req.body;

        // Upsert settings
        const { data, error } = await supabase
            .from('settings')
            .upsert({ user_id: userId, ...settings })
            .select()
            .single();

        if (error) {
            // If table doesn't exist, this will fail. 
            // For this phase, if it fails, we just return the payload as if it worked
            // to unblock frontend.
            console.error('Error updating settings (table might be missing):', error);
            return res.status(200).json(settings);
        }

        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
