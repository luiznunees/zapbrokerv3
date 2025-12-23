import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
};

export const redisConnection = new Redis(redisConfig as any);

redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisConnection.on('connect', () => {
    console.log('Connected to Redis');
});
