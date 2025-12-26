import { z } from 'zod';

export const createCampaignSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    messageVariations: z.string().transform((str) => {
        try {
            const parsed = JSON.parse(str);
            if (!Array.isArray(parsed)) throw new Error('messageVariations deve ser um array');
            if (parsed.length === 0) throw new Error('Pelo menos uma variação de mensagem é necessária');
            if (parsed.some((m: any) => typeof m !== 'string' || m.trim().length === 0)) {
                throw new Error('Todas as variações devem ser strings não vazias');
            }
            return parsed;
        } catch (e) {
            throw new Error('messageVariations inválido: ' + (e as Error).message);
        }
    }),
    sequentialMode: z.string().transform(str => str === 'true').optional().default('false'),
    messageBlocks: z.string().transform((str) => {
        if (!str) return null;
        try {
            const parsed = JSON.parse(str);
            if (!Array.isArray(parsed)) throw new Error('messageBlocks deve ser um array');
            return parsed;
        } catch (e) {
            throw new Error('messageBlocks inválido: ' + (e as Error).message);
        }
    }).optional(),
    blockDelay: z.coerce.number().min(3).max(15).optional(),
    instanceId: z.string().uuid('ID da instância inválido'),
    contactListId: z.string().uuid('ID da lista de contatos inválido'),
    delaySeconds: z.coerce.number().min(1, 'Delay deve ser pelo menos 1 segundo'),
    batchSize: z.coerce.number().min(1, 'Lote deve ser pelo menos 1'),
    batchDelaySeconds: z.coerce.number().min(1, 'Pausa do lote deve ser pelo menos 1 segundo'),
    mediaType: z.enum(['text', 'image', 'video', 'audio', 'document']).optional().default('text')
});
