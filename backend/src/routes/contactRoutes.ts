import { Router } from 'express';
import * as contactController from '../controllers/contactController';
import { authenticateToken } from '../middlewares/authMiddleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /contact-lists:
 *   post:
 *     summary: Create a contact list
 *     tags: [Contacts]
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
 *         description: List created
 *   get:
 *     summary: Get all contact lists
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contact lists
 */
router.post('/', contactController.createList);
router.get('/', contactController.getLists);
router.put('/:listId', contactController.updateList);
router.delete('/:listId', contactController.deleteList);

/**
 * @swagger
 * /contact-lists/{listId}/contacts:
 *   post:
 *     summary: Add a contact to a list
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
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
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contact added
 */
router.post('/:listId/contacts', contactController.addContact);

/**
 * @swagger
 * /contact-lists/{listId}/import:
 *   post:
 *     summary: Import contacts from CSV
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import successful
 */
router.post('/import-csv', upload.single('file'), contactController.importContacts);

/**
 * @swagger
 * /contact-lists/import-pdf:
 *   post:
 *     summary: Create a list and import contacts from PDF
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import successful
 */
router.post('/import-pdf', upload.single('file'), contactController.importPdf);

/**
 * @swagger
 * /contact-lists/import-excel:
 *   post:
 *     summary: Create a list and import contacts from Excel
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import successful
 */
router.post('/import-excel', upload.single('file'), contactController.importExcel);

// Chat Routes
router.get('/chats', contactController.getChats);
router.get('/:contactId/messages', contactController.getMessages);

export default router;
