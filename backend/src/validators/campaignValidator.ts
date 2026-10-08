import { z } from 'zod';

const baseCampaignSchema = z.object({
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
    sequentialMode: z.string().transform(str => str === 'true').optional().default(false),
    blockDelay: z.coerce.number().min(3).max(15).optional().default(5),
    // Aceita o campo antigo (instanceId singular) ou o novo instanceIds (JSON array de UUIDs,
    // pra disparo dividido entre vários números) — sempre normalizado pra array.
    instanceId: z.string().uuid('ID da instância inválido').optional(),
    instanceIds: z.string().optional().transform((str, ctx) => {
        if (!str) return undefined;
        try {
            const parsed = JSON.parse(str);
            if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('instanceIds deve ser um array não vazio');
            return parsed as string[];
        } catch (e) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'instanceIds inválido: ' + (e as Error).message });
            return z.NEVER;
        }
    }),
    contactListId: z.string().uuid('ID da lista de contatos inválido'),
    delaySeconds: z.coerce.number().min(1, 'Delay deve ser pelo menos 1 segundo'),
    batchSize: z.coerce.number().min(1, 'Lote deve ser pelo menos 1'),
    batchDelaySeconds: z.coerce.number().min(1, 'Pausa do lote deve ser pelo menos 1 segundo'),
    // Janela de envio (ver utils/sendWindow.ts) — vem como FormData, então tudo chega string.
    // Campo faltando = padrão (8h–17h, seg a sáb, até 100/dia); normalizeSendWindow valida o resto.
    windowStartMinute: z.coerce.number().int().min(0).max(1440).optional(),
    windowEndMinute: z.coerce.number().int().min(0).max(1440).optional(),
    windowWeekdays: z.string().optional().transform((str, ctx) => {
        if (!str) return undefined;
        try {
            const parsed = JSON.parse(str);
            if (!Array.isArray(parsed)) throw new Error('deve ser um array');
            return parsed.map(Number);
        } catch (e) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'windowWeekdays inválido: ' + (e as Error).message });
            return z.NEVER;
        }
    }),
    windowMaxPerDay: z.string().optional().transform((str) => {
        if (str === undefined || str === '') return undefined;
        if (str === 'null') return null; // sem teto diário, só horário
        return Number(str);
    }),
    mediaType: z.enum(['text', 'image', 'video', 'audio', 'document']).optional().default('text'),
    excludedContactIds: z.string().transform((str) => {
        try {
            if (!str || str === 'undefined' || str === 'null') return [];
            const parsed = JSON.parse(str);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch (e) {
            return [];
        }
    }).optional().default([])
});

export const createCampaignSchema = baseCampaignSchema
    .refine(data => !!data.instanceId || (data.instanceIds && data.instanceIds.length > 0), {
        message: 'Informe ao menos um WhatsApp (instanceId ou instanceIds)',
        path: ['instanceIds'],
    })
    .transform(data => ({
        ...data,
        instanceIds: data.instanceIds && data.instanceIds.length > 0
            ? data.instanceIds
            : [data.instanceId as string],
    }));
