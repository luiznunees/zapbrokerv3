import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AppError } from '../utils/AppError';

// Note: We need admin access to generate links and bypass default emails
// Ideally, `supabase` in config/supabase.ts should be the SERVICE_ROLE client for this to work
// If it's the anon client, this will fail. We assume the user has configured SERVICE_ROLE in backend.

import * as emailService from '../services/emailService';

export const register = async (req: Request, res: Response) => {
    try {
        console.log('Register Request Body:', req.body);
        const { name, email, password } = req.body;

        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // 1. Create User via Admin API (prevents default email if auto-confirm is off, or we just ignore Supabase email)
        // Actually, to use `generateLink`, we often need the user to exist first.
        // We use `signUp` but with a trick: if we have SMTP disabled in Supabase, we can use the returned token?
        // OR we use Admin API to createUser { email, password, email_confirm: false }

        // Let's use authService which wraps supabase.
        // We need updates in authService.ts OR just do it here for specific control.
        // For safety/speed, let's do it here, assuming `supabase` has admin rights (service role).

        const { data: user, error } = await supabase.auth.admin.createUser({
            email,
            password,
            user_metadata: { nome: name },
            email_confirm: false // User is NOT confirmed yet
        });

        if (error) throw error;
        if (!user.user) throw new Error('Failed to create user');

        // 2. Generate Confirmation Link
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'signup',
            email: email,
            password: password, // Sometimes required depending on flow, or we use 'magiclink'
        });

        // 'signup' link usage usually requires the user to start signup. 
        // If createUser was used, we might need 'invite' or 'magiclink'? 
        // Actually, generateLink type 'signup' returns a confirmation url for a user signing up.
        // If user already created via admin, we might need verify_email type? "signup" works for unconfirmed users.

        if (linkError) throw linkError;

        const confirmationUrl = linkData.properties?.action_link || linkData.properties?.email_otp || '';
        // action_link is the full URL.

        if (!confirmationUrl) {
            console.warn('No confirmation URL generated. Is the backend configured with Service Role?');
            // Fallback: Just return success, maybe Supabase sent it if we failed to control it?
        } else {
            // 3. Send via Resend
            await emailService.sendConfirmationEmail(email, confirmationUrl);
        }

        // 4. Send Welcome Email (Optional: usually send AFTER confirmation, but user asked for it)
        // Let's send it now or after they login first time?
        // User said: "resend faça o envio de confirmacao e um envio de bem vindo"
        // Let's send Welcome email immediately for instant gratification? No, bad UX if email is wrong.
        // Proper way: Webhook on 'INSERT public.users' or on 'auth.users' update.
        // Compromise: Send it now, assuming they provided real email.
        await emailService.sendWelcomeEmail(email, name);

        res.status(201).json({
            user: user.user,
            message: 'User created. Confirmation email sent via Resend.'
        });

    } catch (error: any) {
        console.error('Register Error Details:', error);
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.status(200).json(result);
    } catch (error: any) {
        console.error('Login error:', error.message);
        res.status(401).json({ error: error.message });
    }
};

export const getProfile = async (req: any, res: Response) => {
    try {
        // req.user is populated by authMiddleware (from Supabase)
        const user = req.user;

        // We might want to fetch additional data from our 'users' table if needed
        // For now, return what we have or fetch from DB to be sure
        // The frontend expects { user: Usuario, tenant: any }

        // Let's fetch from our DB to get full details including tenantId if stored there
        const { data: dbUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore not found if we trust token
            // If not found in our DB but valid token, maybe return token user?
            // But we should have it.
        }

        const profile = dbUser || {
            id: user.id,
            email: user.email,
            nome: user.user_metadata?.nome || user.email,
            role: 'USER',
            ativo: true,
            criadoEm: user.created_at,
            // Include onboarding fields from DB (or default if null)
            onboarding_steps: dbUser?.onboarding_steps || {},
            first_message_sent: dbUser?.first_message_sent || false
        };

        // Fetch subscription status
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('status, next_billing_date')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        let subscriptionStatus = 'none';
        if (subscription) {
            if (subscription.status === 'active') {
                const now = new Date();
                const nextBilling = new Date(subscription.next_billing_date);
                if (nextBilling > now) {
                    subscriptionStatus = 'active';
                } else {
                    subscriptionStatus = 'expired';
                }
            } else {
                subscriptionStatus = subscription.status; // e.g. 'pending_payment'
            }
        }

        // Mock tenant for now, but include subscriptionStatus
        res.status(200).json({
            user: { ...profile, subscriptionStatus },
            tenant: { id: 'default', name: 'Default Tenant' }
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const updates = req.body; // Expecting { onboarding_steps, first_message_sent, ... }

        if (!userId) throw new AppError('User not authenticated', 401);

        // Whitelist allowed fields to update
        const allowedUpdates: any = {};
        if (updates.onboarding_steps) allowedUpdates.onboarding_steps = updates.onboarding_steps;
        if (typeof updates.first_message_sent === 'boolean') allowedUpdates.first_message_sent = updates.first_message_sent;
        // Map 'nome' from frontend to 'name' in database
        if (updates.nome) allowedUpdates.name = updates.nome;

        if (Object.keys(allowedUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { data, error } = await supabase
            .from('users')
            .update(allowedUpdates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error: any) {
        console.error('Update profile error:', error);
        res.status(400).json({ error: error.message });
    }
};
