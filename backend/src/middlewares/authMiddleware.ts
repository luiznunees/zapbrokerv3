import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAnon } from '../config/supabase';
import * as emailService from '../services/emailService';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`[AuthMiddleware] 🔍 ${req.method} ${req.path} - Token present: ${!!token}`);

    if (!token) {
        console.error(`[AuthMiddleware] ❌ No token for ${req.method} ${req.path}`);
        return res.sendStatus(401);
    }

    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
        console.error(`[AuthMiddleware] 🚫 Token verification failed for ${req.method} ${req.path}:`, error?.message || 'No user found');
        return res.sendStatus(403);
    }

    console.log(`[AuthMiddleware] ✅ Auth successful for ${req.method} ${req.path} - User: ${user.email}`);
    req.user = user;

    // Sync user to public.users table
    try {
        // 1. Check if user exists by ID (Happy path)
        const { data: existingUserById } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!existingUserById) {
            // 2. Check if user exists by Email (Legacy/Conflict path)
            const { data: existingUserByEmail } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();

            if (existingUserByEmail) {
                console.log(`Migrating existing user ${user.email} (Old ID: ${existingUserByEmail.id}) to new Auth ID ${user.id}`);

                const oldId = existingUserByEmail.id;
                // Rename old user to free up email unique constraint
                const tempEmail = `${user.email}_old_${Date.now()}`;

                const { error: renameError } = await supabase
                    .from('users')
                    .update({ email: tempEmail })
                    .eq('id', oldId);

                if (renameError) {
                    console.error('Failed to rename old user for migration:', renameError);
                    // Don't throw, let it fail at insert next step if needed, or return
                }

                // Create new user with new ID
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([
                        {
                            id: user.id,
                            email: user.email,
                            name: user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                            password: 'auth_via_supabase_provider'
                        }
                    ]);

                if (insertError) {
                    console.error('Failed to create new user during migration:', insertError);
                    // Attempt rollback of rename?
                } else {
                    // Send Welcome Email
                    if (user.email) {
                        emailService.sendWelcomeEmail(user.email, user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
                    }

                    // Migrate children tables
                    const tablesToMigrate = [
                        'instances',
                        'campaigns',
                        'contact_lists',
                        'weekly_quotas',
                        'quota_transactions'
                    ];

                    for (const table of tablesToMigrate) {
                        const { error: migrateError } = await supabase
                            .from(table)
                            .update({ user_id: user.id })
                            .eq('user_id', oldId);

                        if (migrateError) console.error(`Failed to migrate ${table}:`, migrateError);
                    }

                    // Delete old user
                    const { error: deleteError } = await supabase
                        .from('users')
                        .delete()
                        .eq('id', oldId);

                    if (deleteError) console.error('Failed to delete old user:', deleteError);

                    console.log('Migration completed successfully.');
                }

            } else {
                // 3. Create new user (Standard path)
                console.log(`Creating new user ${user.email} in public.users`);
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([
                        {
                            id: user.id,
                            email: user.email,
                            name: user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                            password: 'auth_via_supabase_provider'
                        }
                    ]);

                if (insertError) {
                    console.error('Error syncing user to public.users:', insertError);
                } else {
                    // Send Welcome Email for new standard users (including Google OAuth)
                    if (user.email) {
                        emailService.sendWelcomeEmail(user.email, user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
                    }
                }
            }
        }
    } catch (syncError) {
        console.error('Error in user sync:', syncError);
    }

    next();
};
