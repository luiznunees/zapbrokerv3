import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';

function inferMediaType(mimetype: string): 'image' | 'video' | 'audio' | 'document' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'document';
}

export const uploadMedia = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const url = `${baseUrl}/uploads/${req.file.filename}`;
        const mediaType = inferMediaType(req.file.mimetype);

        res.status(201).json({
            url,
            mediaType,
            filename: req.file.originalname,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Erro ao processar upload.' });
    }
};
