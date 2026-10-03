import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initSocket } from './services/socketService';
import { errorHandler } from './middlewares/errorHandler';
import dns from 'dns';
import path from 'path';

// Fix for Node 17+ IPV6 issues
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.zapbroker.dev"],
            fontSrc: ["'self'"],
            frameAncestors: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

const productionOrigins = ['https://zapbroker.dev', 'https://www.zapbroker.dev', 'https://app.zapbroker.dev'];
const devOrigins = ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000', 'http://192.168.0.242:3000'];

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? productionOrigins : [...productionOrigins, ...devOrigins],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check pro deploy sem downtime do EasyPanel: a versão nova só recebe tráfego quando
// responde 200 aqui (servidor de pé + Redis da fila de disparo acessível). Durante o
// desligamento responde 503, pra o proxy parar de mandar requisição pra esse processo.
// Antes do rate limit de propósito — é chamado a cada poucos segundos pela infraestrutura.
let shuttingDown = false;
app.get('/health', async (req, res) => {
    if (shuttingDown) return res.status(503).json({ ok: false, reason: 'shutting_down' });
    try {
        await redisConnection.ping();
        res.status(200).json({ ok: true });
    } catch {
        res.status(503).json({ ok: false, reason: 'redis_unreachable' });
    }
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs (increased from 100)
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 login/register requests per hour (increased from 20)
    message: 'Too many login attempts, please try again later.'
});

// Webhooks must be registered BEFORE express.json() so their raw-body
// middleware (express.raw) can still see the original payload. If the global
// JSON parser runs first, it consumes the body and webhooks get an empty
// buffer, breaking signature verification (Svix/HMAC) and JSON parsing.
import webhookRoutes from './routes/webhookRoutes';
app.use('/webhooks', webhookRoutes);

app.use(express.json());

import { activityLogger } from './middlewares/activityLogger';
app.use(activityLogger);

// Apply auth limiter to auth routes
import authRoutes from './routes/authRoutes';
app.use('/auth', authLimiter, authRoutes);


import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

import { authenticateToken } from './middlewares/authMiddleware';
import agentRoutes from './routes/agentRoutes';
app.use('/agent', authenticateToken, agentRoutes);

import uploadRoutes from './routes/uploadRoutes';
app.use('/uploads', authenticateToken, uploadRoutes);

import instanceRoutes from './routes/instanceRoutes';
app.use('/instances', instanceRoutes);

import dedicatedNumberRoutes from './routes/dedicatedNumberRoutes';
app.use('/dedicated-numbers', dedicatedNumberRoutes);

import pushRoutes from './routes/pushRoutes';
app.use('/push', pushRoutes);

import contactRoutes from './routes/contactRoutes';
app.use('/contact-lists', contactRoutes);

import apiContactRoutes from './routes/apiContactRoutes';
app.use('/api', apiContactRoutes);

import campaignRoutes from './routes/campaignRoutes';
app.use('/campaigns', campaignRoutes);

import quotaRoutes from './routes/quotaRoutes';
app.use('/quotas', quotaRoutes);

import adminRoutes from './routes/adminRoutes';
app.use('/admin', adminRoutes);

import feedbackRoutes from './routes/feedbackRoutes';
app.use('/feedback', feedbackRoutes);

import { runMigrations } from './migrations/create_agent_sessions';

import { startProcessor } from './services/campaignProcessor';
startProcessor();

import { startQuotaRenewalJob } from './jobs/renewQuotas';
startQuotaRenewalJob();

import { startSubscriptionRenewalJob } from './jobs/renewSubscriptions';
startSubscriptionRenewalJob();

import { startMonthlyBillingJob } from './jobs/monthlyBilling';
startMonthlyBillingJob();

import { startReengagementJob } from './jobs/reengagementPush';
startReengagementJob();

import { campaignWorker, beginWorkerShutdown } from './workers/campaignWorker'; // Start BullMQ Worker
import { stopProcessor } from './services/campaignProcessor';
import { redisConnection } from './config/redis';

import * as paymentController from './controllers/paymentController';

// Payment Routes
app.post('/payments/subscribe', authenticateToken, paymentController.createSubscription);
app.get('/payments/subscription/:id', authenticateToken, paymentController.getSubscriptionStatus);
app.post('/payments/subscription/:id/check-now', authenticateToken, paymentController.checkPaymentNow);
app.post('/payments/subscription/cancel', authenticateToken, paymentController.cancelSubscription);

app.get('/', (req, res) => {
    res.send('ZapBroker API is running');
});

// Initialize Socket.io
initSocket(httpServer);

// Global Error Handler
app.use(errorHandler);

httpServer.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    await runMigrations();
});

// ─── Desligamento controlado ─────────────────────────────────────
// Deploy/restart manda SIGTERM. Sem isso o processo morria no meio do que estivesse
// fazendo — inclusive no meio de um envio de disparo. Ordem: para de enfileirar, o worker
// termina (ou devolve pra fila) a mensagem atual, fecha o servidor HTTP e sai.
// Se algo travar, sai à força depois de SHUTDOWN_TIMEOUT_MS — mensagem que ficar no meio
// do envio é marcada como falha pelo processor, nunca reenviada.
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 90_000;

async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Shutdown] ${signal} recebido — desligando com calma...`);
    setTimeout(() => {
        console.error('[Shutdown] Tempo esgotado, saindo à força.');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    try {
        // Para de aceitar conexão nova (não espera as abertas — websocket do socket.io segura
        // o close pra sempre; o processo sai logo abaixo de qualquer jeito).
        httpServer.close();
        await stopProcessor();
        beginWorkerShutdown();
        await campaignWorker.close(); // espera o job atual terminar
        console.log('[Shutdown] Worker de disparo parado.');
        await redisConnection.quit().catch(() => undefined);
    } catch (err: any) {
        console.error('[Shutdown] Erro durante o desligamento:', err?.message || err);
    }
    console.log('[Shutdown] Pronto.');
    process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

