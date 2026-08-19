// Limpa as campanhas de teste presas da suite do agente.
// Passa as campanhas para CANCELLED, marca as campaign_messages como CANCELLED
// e remove os jobs correspondentes da fila BullMQ (senão o worker continua tentando
// enviar mesmo depois de cancelar).
//
// Roda com: npx ts-node scripts/cleanup-test-campaigns.ts
require('dotenv').config();

const supabaseMod = require('../src/config/supabase');
const { Queue } = require('bullmq');
const { redisConnection } = require('../src/config/redis');
const { AGENT_TEST_USER_ID } = process.env;

const supabase = supabaseMod.supabase;

(async () => {
    if (!AGENT_TEST_USER_ID) {
        console.error('❌ Defina AGENT_TEST_USER_ID no .env');
        process.exit(1);
    }

    // Campanhas de teste: do usuário de teste, nome do Amare Resort, ainda não finalizadas
    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, name, status')
        .eq('user_id', AGENT_TEST_USER_ID)
        .ilike('name', 'Disparo - Amare Resort%')
        .in('status', ['PENDING', 'PAUSED']);

    if (error) {
        console.error('Erro ao buscar campanhas:', error.message);
        process.exit(1);
    }

    if (!campaigns || campaigns.length === 0) {
        console.log('Nenhuma campanha de teste presa encontrada — nada a limpar.');
        process.exit(0);
    }

    const ids = campaigns.map((c: any) => c.id);
    console.log(`Campanhas a cancelar (${ids.length}):`);
    for (const c of campaigns) console.log(`  ${c.id} | "${c.name}" | ${c.status}`);

    // 1. Cancela as campanhas
    const { error: cancelError } = await supabase
        .from('campaigns')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .in('id', ids);
    if (cancelError) throw new Error(cancelError.message);

    // 2. Marca as mensagens como CANCELLED
    const { error: msgError } = await supabase
        .from('campaign_messages')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .in('campaign_id', ids);
    if (msgError) throw new Error(msgError.message);

    // 3. Remove os jobs pendentes da fila BullMQ (por campaignId no job.data)
    const queue = new Queue('campaign-dispatch', { connection: redisConnection });
    try {
        const jobs = await queue.getJobs(['waiting', 'delayed', 'active', 'prioritized']);
        const toRemove = jobs.filter((job: any) => ids.includes(job.data?.campaignId));
        for (const job of toRemove) {
            await job.remove();
        }
        console.log(`\nJobs removidos da fila: ${toRemove.length}`);
        if (toRemove.length > 0) {
            console.log('IDs dos jobs removidos:', toRemove.map((j: any) => j.id).join(', '));
        }
    } finally {
        await queue.close();
    }

    console.log('\n✅ Limpeza concluída.');
    process.exit(0);
})();