import { Router } from 'express';
import * as contactController from '../controllers/contactController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/contacts/count', contactController.getContactsCount);
router.get('/contatos', contactController.getAllContacts);
router.post('/contatos', contactController.createContact);
router.put('/contatos/:id', contactController.updateContact);
router.delete('/contatos/:id', contactController.deleteContact);

export default router;
