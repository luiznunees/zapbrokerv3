import { Router } from 'express';
import * as feedbackController from '../controllers/feedbackController';

const router = Router();

// Pública de propósito — ver feedbackController.submitFeedback.
router.post('/', feedbackController.submitFeedback);

export default router;
