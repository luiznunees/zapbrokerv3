import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    // Prefixo com o id do dono: é o que GET /uploads/media/:filename usa pra só entregar o
    // arquivo pra quem subiu (antes qualquer conta logada baixava arquivo de outra — listas
    // de telefone de clientes inclusive). Sufixo com crypto em vez de Math.random pra não
    // ser adivinhável. Todas as rotas que usam esse middleware passam por authenticateToken antes.
    filename: (req: any, file, cb) => {
        const ownerId = String(req.user?.id || 'anon').replace(/[^a-zA-Z0-9-]/g, '');
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(12).toString('hex');
        cb(null, `${ownerId}_${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const ALLOWED_MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/mp4',
    'audio/webm',
    'audio/x-m4a'
];

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB — limite de mídia do WhatsApp

export const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
            cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
            return;
        }
        cb(null, true);
    }
});
