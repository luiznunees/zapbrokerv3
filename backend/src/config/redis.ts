import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisConfig: any = {
    maxRetriesPerRequest: null,
};

if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);
    redisConfig.host = url.hostname;
    redisConfig.port = Number(url.port) || 6379;
    redisConfig.password = url.password ? decodeURIComponent(url.password) : undefined;
} else {
    redisConfig.host = process.env.REDIS_HOST || 'localhost';
    redisConfig.port = Number(process.env.REDIS_PORT) || 6379;
    redisConfig.password = process.env.REDIS_PASSWORD || undefined;
}

export const redisConnection = new Redis(redisConfig as any);

redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisConnection.on('connect', () => {
    console.log('Connected to Redis');
});
