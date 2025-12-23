import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const campaignQueue = new Queue('campaign-dispatch', {
    connection: redisConnection
});
