import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = Router();

// Protect all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/stats', adminController.getStats);
router.get('/logs', adminController.getLogs);

// Users
router.get('/users', adminController.listUsers);
router.post('/users/:id/ban', adminController.banUser);

// Invites
router.post('/invites', adminController.createInvite);

export default router;
