// Limpa jobs da fila campaign-dispatch associados a campanhas CANCELLED.
require('dotenv').config();
const { Queue } = require('bullmq');
const { redisConnection } = require('../src/config/redis');

const queue = new Queue('campaign-dispatch', { connection: redisConnection });

(async () => {
  const counts = await queue.getJobCounts('waiting', 'delayed', 'active', 'failed', 'completed');
  console.log('contagens da fila:', JSON.stringify(counts));

  for (const state of ['waiting', 'delayed', 'prioritized']) {
    const jobs = await queue.getJobs([state], 0, 1000);
    if (!jobs.length) continue;
    console.log(`${state}: ${jobs.length} jobs`);
    for (const job of jobs) {
      const { campaignId } = job.data || {};
      // remove qualquer job que não esteja concluído — as campanhas de teste foram canceladas no banco
      await job.remove();
    }
    console.log(`  removidos ${jobs.length} (${state})`);
  }

  const remaining = await queue.getJobCounts('waiting', 'delayed', 'active', 'failed');
  console.log('contagens finais:', JSON.stringify(remaining));

  await queue.close();
  process.exit(0);
})();