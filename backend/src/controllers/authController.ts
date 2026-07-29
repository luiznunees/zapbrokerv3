import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AppError } from '../utils/AppError';

import * as eventLogService from '../services/eventLogService';

export const register = async (req: Request, res: Response) => {
    try {
        console.log('Register Request Body:', { ...req.body, password: '***' });
        const { name, email, password, inviteCode, planId } = req.body;

        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // 0. Validate Invite if present
        let inviteData = null;
        if (inviteCode) {
            const { data: invite, error: inviteError } = await supabase
                .from('admin_invites')
                .select('*')
                .eq('code', inviteCode)
                .eq('is_used', false)
                .single();

            if (inviteError || !invite) {
                throw new Error('Código de convite inválido ou já utilizado.');
            }
            inviteData = invite;
        }

        // 1. Create User via Admin API
        // Confirmação de email por link foi removida de propósito — todo cadastro entra
        // direto, sem esse passo extra de fricção. A verificação real acontece de outro
        // jeito (pagamento confirmado, convite validado, ou simplesmente uso da conta).
        const { data: user, error } = await supabase.auth.admin.createUser({
            email,
            password,
            user_metadata: { nome: name },
            email_confirm: true
        });

        if (error) throw error;
        if (!user.user) throw new Error('Failed to create user');

        eventLogService.logEvent({
            type: 'auth.new_signup',
            severity: 'info',
            message: `Novo cadastro: ${email}${inviteData ? ' (via convite)' : planId ? ` (plano ${planId})` : ''}`,
            userId: user.user.id,
            metadata: { email, planId: planId || null, viaInvite: !!inviteData },
        });

        // 1.1 Process Invite (Mark as used and Create Subscription)
        if (inviteData && user.user) {
            // Mark invite as used
            await supabase
                .from('admin_invites')
                .update({ is_used: true, used_by: user.user.id })
                .eq('id', inviteData.id);

            // Create Subscription
            await supabase
                .from('subscriptions')
                .insert([{
                    user_id: user.user.id,
                    plan_id: inviteData.plan_id,
                    status: 'active',
                    start_date: new Date(),
                    next_billing_date: new Date(new Date().setFullYear(new Date().getFullYear() + 100)) // 100 years for invited plans (lifetime/freemium)
                }]);

            const inviteSession = await authService.loginUser(email, password);
            return res.status(201).json({
                user: inviteSession.user,
                token: inviteSession.token,
                message: 'Conta criada com sucesso via convite!'
            });
        }

        // 2. Fluxo padrão (com ou sem plano escolhido): login imediato, sem confirmação de email.
        const session = await authService.loginUser(email, password);
        return res.status(201).json({
            user: session.user,
            token: session.token,
            message: 'Conta criada com sucesso.'
        });

    } catch (error: any) {
        console.error('Register Error:', error.message);
        res.status(400).json({ error: 'Falha ao criar conta. Verifique os dados e tente novamente.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.status(200).json(result);
    } catch (error: any) {
        console.error('Login error:', error.message);
        // Login falhou, mas se o email pertencer a um usuário real (só a senha errou),
        // ainda dá pra identificar quem tentou — logEvent enriquece com nome/email a partir do userId.
        const attemptedEmail = req.body?.email;
        const { data: existingUser } = attemptedEmail
            ? await supabase.from('users').select('id').eq('email', attemptedEmail).maybeSingle()
            : { data: null };
        eventLogService.logEvent({
            type: 'auth.login_failed',
            severity: 'warn',
            message: `Tentativa de login falhou para ${attemptedEmail || 'email desconhecido'}`,
            userId: existingUser?.id,
            metadata: { attemptedEmail: attemptedEmail || null },
        });
        res.status(401).json({ error: 'Email ou senha inválidos.' });
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

        // Fetch subscription status and plan info
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('status, next_billing_date, plan_id, pix_cpf, pix_cellphone')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        let subscriptionStatus = 'free';
        let planName = 'Free';

        if (subscription) {
            const planNames: Record<string, string> = {
                'pro': 'ZapBroker - Pro',
                'starter': 'ZapBroker - Starter',
            };
            planName = planNames[subscription.plan_id] || 'ZapBroker Plan';

            if (subscription.status === 'active') {
                const now = new Date();
                const nextBilling = new Date(subscription.next_billing_date);
                if (nextBilling > now) {
                    subscriptionStatus = 'active';
                } else {
                    subscriptionStatus = 'expired';
                }
            } else {
                subscriptionStatus = subscription.status;
            }
        }

        // Mock tenant for now, but include subscriptionStatus and planName
        res.status(200).json({
            user: {
                ...profile,
                subscriptionStatus,
                planName,
                planId: subscription?.plan_id || null,
                pixCpf: subscription?.pix_cpf || null,
                pixCellphone: subscription?.pix_cellphone || null,
            },
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

        // Handle onboarding_steps and preferences
        if (updates.onboarding_steps) {
            allowedUpdates.onboarding_steps = updates.onboarding_steps;
        }

        // Specifically allow individual preference updates that might come separate
        if (typeof updates.email_notifications === 'boolean' || typeof updates.quota_alerts === 'boolean') {
            const currentSteps = req.user?.onboarding_steps || {};
            allowedUpdates.onboarding_steps = {
                ...currentSteps,
                email_notifications: updates.email_notifications !== undefined ? updates.email_notifications : currentSteps.email_notifications,
                quota_alerts: updates.quota_alerts !== undefined ? updates.quota_alerts : currentSteps.quota_alerts
            };
        }

        // Contexto do corretor (cidade, quantos chips, pra que usa cada um, interesse em
        // listagens) — usado pelo agente pra personalizar avisos e sugestões. Guardado dentro
        // do mesmo onboarding_steps (jsonb), sem precisar de migração.
        if (updates.broker_context && typeof updates.broker_context === 'object') {
            const currentSteps = allowedUpdates.onboarding_steps || req.user?.onboarding_steps || {};
            allowedUpdates.onboarding_steps = {
                ...currentSteps,
                broker_context: {
                    ...(currentSteps.broker_context || {}),
                    ...updates.broker_context,
                },
            };
        }

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
