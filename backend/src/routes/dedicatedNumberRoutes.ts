import { Router } from 'express';
import * as dedicatedNumberController from '../controllers/dedicatedNumberController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /dedicated-numbers/checkout:
 *   post:
 *     summary: Create a dedicated number checkout (PIX pro-rata, activated after payment)
 *     tags: [DedicatedNumbers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - areaCode
 *               - cpf
 *               - cellphone
 *             properties:
 *               areaCode:
 *                 type: number
 *               cpf:
 *                 type: string
 *               cellphone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Checkout created with PIX QR code
 */
router.post('/checkout', dedicatedNumberController.createCheckout);

/**
 * @swagger
 * /dedicated-numbers/checkout/{id}/status:
 *   get:
 *     summary: Check dedicated number checkout payment status
 *     tags: [DedicatedNumbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status (pending_payment | active)
 */
router.get('/checkout/:id/status', dedicatedNumberController.checkoutStatus);

/**
 * @swagger
 * /dedicated-numbers:
 *   get:
 *     summary: List dedicated numbers
 *     tags: [DedicatedNumbers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dedicated numbers
 */
router.get('/', dedicatedNumberController.list);

/**
 * @swagger
 * /dedicated-numbers/area-codes:
 *   get:
 *     summary: List available area codes (DDD)
 *     tags: [DedicatedNumbers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available area codes
 */
router.get('/area-codes', dedicatedNumberController.areaCodes);

/**
 * @swagger
 * /dedicated-numbers/{id}:
 *   get:
 *     summary: Get dedicated number by ID
 *     tags: [DedicatedNumbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dedicated number details
 *   delete:
 *     summary: Cancel a dedicated number
 *     tags: [DedicatedNumbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dedicated number canceled
 */
router.get('/:id', dedicatedNumberController.getById);
router.delete('/:id', dedicatedNumberController.remove);

/**
 * @swagger
 * /dedicated-numbers/{id}/sms:
 *   get:
 *     summary: List SMS messages received by a dedicated number
 *     tags: [DedicatedNumbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of SMS messages
 */
router.get('/:id/sms', dedicatedNumberController.sms);

/**
 * @swagger
 * /dedicated-numbers/{id}/simulate-sms:
 *   post:
 *     summary: Simulate an incoming SMS (sandbox only, end-to-end test)
 *     tags: [DedicatedNumbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rawText
 *             properties:
 *               rawText:
 *                 type: string
 *     responses:
 *       200:
 *         description: SMS simulated, webhook sms.received fired
 */
router.post('/:id/simulate-sms', dedicatedNumberController.simulateSms);

export default router;