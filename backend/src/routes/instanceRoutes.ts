import { Router } from 'express';
import * as instanceController from '../controllers/instanceController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /instances:
 *   post:
 *     summary: Create a new instance
 *     tags: [Instances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Instance created
 *   get:
 *     summary: List instances
 *     tags: [Instances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of instances
 */
router.post('/', instanceController.create);
router.get('/', instanceController.list);

/**
 * @swagger
 * /instances/{id}/connect:
 *   get:
 *     summary: Get connection QR Code
 *     tags: [Instances]
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
 *         description: Connection data
 */
router.get('/:id/connect', instanceController.connect);

/**
 * @swagger
 * /instances/{id}:
 *   delete:
 *     summary: Delete an instance
 *     tags: [Instances]
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
 *         description: Instance deleted
 */
router.delete('/:id', instanceController.remove);

/**
 * @swagger
 * /instances/{id}/logout:
 *   post:
 *     summary: Logout an instance
 *     tags: [Instances]
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
 *         description: Instance logged out
 */
router.post('/:id/logout', instanceController.logout);

export default router;
