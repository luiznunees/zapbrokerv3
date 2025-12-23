import { z } from 'zod';

export const createCampaignSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    message: z.string().min(1, 'Mensagem é obrigatória'),
    instanceId: z.string().uuid('ID da instância inválido'),
    contactListId: z.string().uuid('ID da lista de contatos inválido'),
    delaySeconds: z.coerce.number().min(1, 'Delay deve ser pelo menos 1 segundo'),
    batchSize: z.coerce.number().min(1, 'Lote deve ser pelo menos 1'),
    batchDelaySeconds: z.coerce.number().min(1, 'Pausa do lote deve ser pelo menos 1 segundo'),
    mediaType: z.enum(['text', 'image', 'video', 'audio', 'document']).optional().default('text')
});
