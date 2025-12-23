
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from current directory
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (result.error) {
    console.warn('⚠️ Error loading .env file:', result.error.message);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('--- ENV DEBUG ---');
console.log('CWD:', process.cwd());
console.log('SUPABASE_URL found:', !!supabaseUrl);
console.log('SUPABASE_KEY found:', !!supabaseKey);
console.log('-----------------');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantPlan() {
    console.log('🔌 Connecting to Supabase...');

    // 1. Find or Create Plan
    console.log('📦 Checking Plans...');
    let { data: plans, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('name', 'Top Producer')
        .maybeSingle();

    if (!plans) {
        console.log('⚠️ Plan "Top Producer" not found. Creating it...');
        const { data: newPlan, error: createError } = await supabase
            .from('plans')
            .insert({
                name: 'Top Producer',
                description: 'Plano com tudo liberado',
                price: 99.90,
                credits: 10000,
                features: ['whatsapp_marketing', 'ai_agent', 'kanban']
            })
            .select()
            .single();

        if (createError) {
            console.error('❌ Error creating plan:', createError.message);
            // Try fallback
            const { data: anyPlan } = await supabase.from('plans').select('*').limit(1).single();
            if (anyPlan) {
                console.log('🔄 Fallback: Using existing plan:', anyPlan.name);
                plans = anyPlan;
            } else {
                return;
            }
        } else {
            plans = newPlan;
            console.log('✅ Plan Created:', plans.name);
        }
    } else {
        console.log('✅ Plan Found:', plans.name);
    }

    // 2. Get User
    console.log('👤 Finding User...');
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error('❌ No users found in public.users table.');
        return;
    }

    const user = users[0];
    console.log(`👤 Granting plan to: ${user.email} (${user.id})`);

    // 3. Create Subscription
    console.log('🎫 Creating Subscription...');

    // Check if already exists
    const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

    if (existingSub) {
        console.log('⚠️ User already has an active subscription:', existingSub.id);
        return;
    }

    const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .insert({
            user_id: user.id,
            plan_id: plans.id,
            status: 'active',
            current_period_start: new Date(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        })
        .select()
        .single();

    if (subError) {
        console.error('❌ Error creating subscription:', subError.message);
    } else {
        console.log('✅ Subscription Active! ID:', sub.id);

        // 4. Create Initial Quota
        console.log('📊 Initializing Weekly Quota...');
        const { error: quotaError } = await supabase
            .from('weekly_quotas')
            .insert({
                user_id: user.id,
                plan_id: plans.id,
                limit_count: plans.credits || 1000,
                used_count: 0,
                week_start: new Date()
            });

        if (quotaError) console.warn('⚠️ Could not init quota (maybe trigger handles it):', quotaError.message);
        else console.log('✅ Quota initialized.');
    }
}

grantPlan().catch(console.error);
