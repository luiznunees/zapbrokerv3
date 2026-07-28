import { Router } from 'express';
import { upload } from '../middlewares/uploadMiddleware';
import * as uploadController from '../controllers/uploadController';
import path from 'path';

const router = Router();

router.post('/media', upload.single('file'), uploadController.uploadMedia);

// authenticateToken já é aplicado no mount deste router (server.ts) — aqui só falta impedir
// path traversal (req.params.filename podia conter "../" e escapar da pasta uploads).
router.get('/media/:filename', (req, res) => {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(process.cwd(), 'uploads', safeFilename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    });
});

export default router;
