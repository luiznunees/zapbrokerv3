import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initSocket } from './services/socketService';
import { errorHandler } from './middlewares/errorHandler';
import dns from 'dns';

// Fix for Node 17+ IPV6 issues
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000', 'http://192.168.0.242:3000', 'https://zapbroker.dev', 'https://www.zapbroker.dev'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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

app.use(express.json());

// Apply auth limiter to auth routes
import authRoutes from './routes/authRoutes';
app.use('/auth', authLimiter, authRoutes);
app.use('/uploads', express.static('uploads')); // Serve uploaded files

import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

import instanceRoutes from './routes/instanceRoutes';
app.use('/instances', instanceRoutes);

import contactRoutes from './routes/contactRoutes';
app.use('/contact-lists', contactRoutes);

import campaignRoutes from './routes/campaignRoutes';
app.use('/campaigns', campaignRoutes);

import webhookRoutes from './routes/webhookRoutes';
app.use('/webhooks', webhookRoutes);

import quotaRoutes from './routes/quotaRoutes';
app.use('/quotas', quotaRoutes);

import { startProcessor } from './services/campaignProcessor';
startProcessor();

import { startQuotaRenewalJob } from './jobs/renewQuotas';
startQuotaRenewalJob();

import './workers/campaignWorker'; // Start BullMQ Worker

import * as paymentController from './controllers/paymentController';
import { authenticateToken } from './middlewares/authMiddleware';

// Payment Routes
app.post('/payments/subscribe', authenticateToken, paymentController.createSubscription);
app.get('/payments/subscription/:id', authenticateToken, paymentController.getSubscriptionStatus);

app.get('/', (req, res) => {
    res.send('ZapBroker API is running');
});

// Initialize Socket.io
initSocket(httpServer);

// Global Error Handler
app.use(errorHandler);

import legacyRoutes from './routes/legacyRoutes';
app.use('/api', legacyRoutes); // Mount at /api to match frontend baseURL (http://localhost:3000/api)
// Note: frontend api.ts has baseURL: 'http://localhost:3000/api'
// So requests will be /api/whatsapp/connect, /api/contatos, etc.
// My legacyRoutes defines /whatsapp/connect, /contatos.
// So mounting at /api is correct.

httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

