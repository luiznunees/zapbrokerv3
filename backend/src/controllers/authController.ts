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
                session: inviteSession.session,
                message: 'Conta criada com sucesso via convite!'
            });
        }

        // 2. Fluxo padrão (com ou sem plano escolhido): login imediato, sem confirmação de email.
        const loginResult = await authService.loginUser(email, password);
        return res.status(201).json({
            user: loginResult.user,
            token: loginResult.token,
            session: loginResult.session,
            message: 'Conta criada com sucesso.'
        });

    } catch (error: any) {
        console.error('Register Error:', error.message);
        res.status(400).json({ error: friendlyRegisterError(error.message) });
    }
};

function friendlyRegisterError(message: string): string {
    const lower = (message || '').toLowerCase();
    if (lower.includes('already been registered') || lower.includes('already registered') || lower.includes('duplicate')) {
        return 'Esse email já tem uma conta. Tente entrar ou recuperar sua senha.';
    }
    if (lower.includes('password') && (lower.includes('short') || lower.includes('least') || lower.includes('weak'))) {
        return 'Senha muito curta. Use pelo menos 6 caracteres.';
    }
    if (lower.includes('invalid') && lower.includes('email')) {
        return 'Email inválido. Verifique e tente novamente.';
    }
    if (lower.includes('convite')) {
        return message;
    }
    return 'Falha ao criar conta. Verifique os dados e tente novamente.';
}

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

        // Touch de atividade: marca quando o corretor acessou o app por último.
        // Base do re-engajamento (notificações de quem parou de usar).
        await supabase
            .from('users')
            .update({ last_active_at: new Date() })
            .eq('id', user.id);

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

// Right-to-erasure flow promised on /lgpd ("revogação do consentimento através da exclusão
// da conta") — best-effort delete of everything this user owns, in FK dependency order,
// before removing the auth user itself. If the final admin.deleteUser call still fails
// (some table we don't know about referencing the user), we don't leave the account in a
// half-deleted state silently: we alert ourselves via a critical event so it gets finished
// manually, and tell the user their request was received rather than claiming it's done.
export const deleteAccount = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const email = req.user?.email;
    if (!userId) throw new AppError('Not authenticated', 401);

    try {
        const { data: subs } = await supabase.from('subscriptions').select('id').eq('user_id', userId);
        const subIds = (subs || []).map(s => s.id);
        if (subIds.length) {
            await supabase.from('payments').delete().in('subscription_id', subIds);
            await supabase.from('subscriptions').delete().in('id', subIds);
        }

        const { data: campaigns } = await supabase.from('campaigns').select('id').eq('user_id', userId);
        const campaignIds = (campaigns || []).map(c => c.id);
        if (campaignIds.length) {
            await supabase.from('campaign_messages').delete().in('campaign_id', campaignIds);
            await supabase.from('campaign_instances').delete().in('campaign_id', campaignIds);
            await supabase.from('campaigns').delete().in('id', campaignIds);
        }

        const { data: sessions } = await supabase.from('agent_sessions').select('id').eq('user_id', userId);
        const sessionIds = (sessions || []).map(s => s.id);
        if (sessionIds.length) {
            await supabase.from('agent_messages').delete().in('session_id', sessionIds);
            await supabase.from('agent_sessions').delete().in('id', sessionIds);
        }

        const { data: lists } = await supabase.from('contact_lists').select('id').eq('user_id', userId);
        const listIds = (lists || []).map(l => l.id);
        if (listIds.length) {
            await supabase.from('contacts').delete().in('contact_list_id', listIds);
            await supabase.from('contact_lists').delete().in('id', listIds);
        }

        await supabase.from('instances').delete().eq('user_id', userId);
        await supabase.from('quota_transactions').delete().eq('user_id', userId);
        await supabase.from('weekly_quotas').delete().eq('user_id', userId);
        await supabase.from('agent_user_memory').delete().eq('user_id', userId);
        await supabase.from('users').delete().eq('id', userId);

        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        eventLogService.logEvent({
            type: 'auth.account_deleted',
            severity: 'info',
            message: `Conta excluída: ${email}`,
            userId,
            metadata: { email },
        });

        res.status(200).json({ message: 'Conta excluída com sucesso.' });
    } catch (error: any) {
        console.error('Delete account error:', error.message);
        eventLogService.logEvent({
            type: 'auth.account_deletion_failed',
            severity: 'critical',
            message: `Falha ao excluir conta de ${email}: ${error.message}`,
            userId,
            metadata: { email, error: error.message },
        });
        res.status(202).json({
            message: 'Recebemos seu pedido de exclusão. Alguns dados exigem revisão manual — sua conta será completamente removida em até 5 dias úteis.',
        });
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
