import { supabase } from '../src/config/supabase';

// Uso:
//   ts-node scripts/extend_trial.ts <email|user_id> [dias] [--apply]
// Sem --apply, só mostra o estado atual (dry-run).

async function main() {
    const args = process.argv.slice(2);
    const apply = args.includes('--apply');
    const positional = args.filter(a => !a.startsWith('--'));
    const target = positional[0];
    const days = parseInt(positional[1] || '7', 10);

    if (!target) {
        console.error('Uso: ts-node scripts/extend_trial.ts <email|user_id> [dias] [--apply]');
        process.exit(1);
    }

    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .or(isId ? `id.eq.${target}` : `email.eq.${target}`)
        .single();

    if (userError || !user) {
        console.error('Usuário não encontrado:', userError?.message || target);
        process.exit(1);
    }

    const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('id, plan_id, status, trial_ends_at, next_billing_date, stripe_subscription_id, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

    if (subError) {
        console.error('Erro ao buscar assinatura:', subError.message);
        process.exit(1);
    }

    console.log(`User:  ${user.email} (${user.id})`);
    if (!sub) {
        console.log('Assinatura: nenhuma encontrada');
        process.exit(0);
    }

    const now = new Date();
    const base = sub.trial_ends_at ? new Date(sub.trial_ends_at) : now;
    const start = base > now ? base : now;
    const newEnd = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

    console.log(`Assinatura: plan=${sub.plan_id} status=${sub.status}`);
    console.log(`trial_ends_at atual: ${sub.trial_ends_at ?? '(null)'}`);
    console.log(`novo trial_ends_at: ${newEnd.toISOString()}  (+${days}d ${sub.trial_ends_at && base > now ? 'a partir do vencimento atual' : 'a partir de agora'})`);

    if (!apply) {
        console.log('\n[dry-run] rode com --apply para gravar.');
        return;
    }

    const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
            trial_ends_at: newEnd,
            status: 'active',
            updated_at: now
        })
        .eq('id', sub.id);

    if (updateError) {
        console.error('Erro ao atualizar:', updateError.message);
        process.exit(1);
    }

    console.log('✅ Trial estendido. Nova assinatura:');
    const { data: after } = await supabase
        .from('subscriptions')
        .select('plan_id, status, trial_ends_at')
        .eq('id', sub.id)
        .single();
    console.log(after);
}

main().then(() => process.exit(0));
