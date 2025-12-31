import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

export const getSystemStats = async () => {
    // 1. Total Users
    const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    // 2. Active Instances
    const { count: instanceCount } = await supabase
        .from('instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'connected');

    // 3. Message Stats (Today) - Assuming 'messages' table has created_at
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: messagesToday } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

    // 4. Error Count (Instances in error state)
    const { count: errorCount } = await supabase
        .from('instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error');

    return {
        users: userCount || 0,
        activeInstances: instanceCount || 0,
        messagesToday: messagesToday || 0,
        activeErrors: errorCount || 0
    };
};

export const getUsers = async (page = 1, limit = 20, search = '') => {
    let query = supabase
        .from('users')
        .select(`
            *,
            instances(count),
            subscriptions(plan_id, status)
        `)
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    return {
        data: data.map(u => ({
            ...u,
            instanceCount: u.instances?.[0]?.count || 0,
            plan: u.subscriptions?.[0]?.plan_id || 'Free',
            status: u.subscriptions?.[0]?.status || 'inactive'
        })),
        page,
        limit
    };
};

export const banUser = async (userId: string) => {
    // We can interpret 'ban' as deleting the user or setting a flag.
    // For now, let's assume we don't have a 'banned' flag, so maybe just log for now
    // OR we added a 'role' column, maybe we create 'banned' role?
    // Let's create a specific column 'banned' or use metadata. 
    // Supabase Auth has 'banUser' via admin api.

    const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '876000h' // 100 years
    });

    if (error) throw error;
    return { success: true };
};

export const generateInvite = async (planId: string, createdBy: string) => {
    // Generate a unique code
    const code = uuidv4().substring(0, 8).toUpperCase(); // Short code

    const { data, error } = await supabase
        .from('admin_invites')
        .insert([{
            code,
            plan_id: planId,
            created_by: createdBy // If we add this column, or just ignore
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const getSystemLogs = async () => {
    // Return instances with errors or disconnected state as 'logs'
    const { data, error } = await supabase
        .from('instances')
        .select('id, name, status, updated_at, phone_number')
        .or('status.eq.error,status.eq.disconnected')
        .order('updated_at', { ascending: false })
        .limit(50);

    if (error) throw new Error(error.message);

    return data.map(i => ({
        id: i.id,
        level: i.status === 'error' ? 'ERROR' : 'WARN',
        message: `Instance ${i.name} (${i.phone_number}) is ${i.status}`,
        timestamp: i.updated_at,
        source: 'Instance Monitor'
    }));
};
