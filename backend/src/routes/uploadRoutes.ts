import { Router } from 'express';
import { upload } from '../middlewares/uploadMiddleware';
import * as uploadController from '../controllers/uploadController';
import path from 'path';
import { supabase } from '../config/supabase';

const router = Router();

router.post('/media', upload.single('file'), uploadController.uploadMedia);

// authenticateToken já é aplicado no mount deste router (server.ts). Além de impedir path
// traversal, só entrega o arquivo pro dono (prefixo "<userId>_" no nome, ver uploadMiddleware)
// ou pra admin (suporte). Arquivos antigos, sem prefixo, ficam só pra admin.
router.get('/media/:filename', async (req: any, res) => {
    const safeFilename = path.basename(req.params.filename);
    const isOwner = Boolean(req.user?.id) && safeFilename.startsWith(`${req.user.id}_`);
    if (!isOwner) {
        const { data: user } = await supabase.from('users').select('role').eq('id', req.user?.id).single();
        if (user?.role !== 'admin') {
            // 404 (não 403) pra não confirmar que o arquivo existe.
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    }
    const filePath = path.join(process.cwd(), 'uploads', safeFilename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    });
});

export default router;
