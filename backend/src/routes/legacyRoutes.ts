import { Router } from 'express';
import * as legacyInstanceController from '../controllers/legacyInstanceController';
import * as contactController from '../controllers/contactController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

// WhatsApp Routes
router.post('/whatsapp/connect', legacyInstanceController.connect);
router.get('/whatsapp/status', legacyInstanceController.getStatus);
router.post('/whatsapp/logout', legacyInstanceController.logout);
router.get('/whatsapp/instances', legacyInstanceController.listInstances);
router.post('/whatsapp/test', legacyInstanceController.testMessage);

// Contact Routes (Legacy aliases)
// Auth Routes
import * as authController from '../controllers/authController';
router.get('/auth/profile', authController.getProfile);

// Contact Routes (Legacy aliases & CRUD)
router.get('/contatos', contactController.getAllContacts);
router.get('/contacts/count', authenticateToken, contactController.getContactsCount);
router.post('/contatos', contactController.createContact);
router.put('/contatos/:id', contactController.updateContact);
router.delete('/contatos/:id', contactController.deleteContact);

router.get('/categorias', contactController.getLists);
router.post('/categorias', contactController.createList);

// Settings Routes
import * as settingsController from '../controllers/settingsController';
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

// Campaign Routes (Legacy aliases)
import * as campaignController from '../controllers/campaignController';
import { upload } from '../middlewares/uploadMiddleware';

router.get('/campaigns', campaignController.list);
router.post('/campaigns', upload.single('media'), campaignController.create);

export default router;
