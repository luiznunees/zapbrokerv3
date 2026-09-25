import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import * as feedbackController from '../controllers/feedbackController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = Router();

// Protect all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getLogs);
router.get('/activity-logs/raw', adminController.getRawActivityLogs);
router.post('/deploy/:service', adminController.triggerDeploy);
router.get('/finance', adminController.getFinance);
router.get('/ai-credits', adminController.getAiCredits);

// Users
router.get('/users', adminController.listUsers);
router.post('/users/:id/ban', adminController.banUser);
router.get('/users/:id', adminController.getUserDetail);
router.get('/users/:id/raw-logs', adminController.getUserRawLogs);
router.get('/users/:id/conversations', adminController.getUserConversations);
router.post('/users/:id/campaigns/:campaignId/:action', adminController.setUserCampaignPaused);

// Invites
router.get('/invites', adminController.listInvites);
router.post('/invites', adminController.createInvite);
router.post('/invites/:id/revoke', adminController.revokeInvite);

// Feedback do beta
router.get('/feedback', feedbackController.listFeedback);

export default router;
