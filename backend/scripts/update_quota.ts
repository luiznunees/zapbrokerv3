import { supabase } from '../src/config/supabase';

async function updateQuota() {
    const email = 'luis@admin.io';
    console.log(`Finding user with email: ${email}`);

    // 1. Find User
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (userError || !user) {
        console.error('User not found:', userError);
        return;
    }

    console.log(`User found: ${user.id}`);

    // 2. Find Active Quota
    const { data: quota, error: quotaError } = await supabase
        .from('weekly_quotas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .single();

    if (quotaError && quotaError.code !== 'PGRST116') {
        console.error('Error fetching quota:', quotaError);
        return;
    }

    if (quota) {
        console.log(`Updating existing quota: ${quota.id}`);
        const { error: updateError } = await supabase
            .from('weekly_quotas')
            .update({
                plan_limit: 999999,
                messages_remaining: 999999
            })
            .eq('id', quota.id);

        if (updateError) {
            console.error('Error updating quota:', updateError);
        } else {
            console.log('✅ Quota updated successfully correctly!');
        }
    } else {
        console.log('No active quota found. Creating new one...');
        // Insert new quota if none exists
        const { error: insertError } = await supabase
            .from('weekly_quotas')
            .insert({
                user_id: user.id,
                week_start: new Date().toISOString().split('T')[0],
                week_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                plan_limit: 999999,
                messages_used: 0,
                messages_remaining: 999999,
                status: 'ACTIVE'
            });

        if (insertError) {
            console.error('Error inserting quota:', insertError);
        } else {
            console.log('✅ New unlimited quota created successfully!');
        }
    }
}

updateQuota();
