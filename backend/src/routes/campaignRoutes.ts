import { Router } from 'express';
import * as campaignController from '../controllers/campaignController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';
import { checkQuota } from '../middlewares/checkQuota';
import multer from 'multer';
import path from 'path';

const router = Router();

router.use(authenticateToken);

router.get('/debug-status', requireAdmin, campaignController.debugStatus);

import { upload } from '../middlewares/uploadMiddleware';

router.post('/', upload.single('media'), checkQuota, campaignController.create);
router.get('/', campaignController.list);
router.get('/:id', campaignController.getDetails);
router.post('/:id/pause', campaignController.pause);
router.post('/:id/resume', campaignController.resume);
router.get('/:campaignId/kanban', campaignController.getKanban);
router.put('/messages/:messageId/status', campaignController.updateLeadStatus);

export default router;
