import { Request, Response, NextFunction } from 'express';
import { logRawActivity } from '../services/activityLogService';

// So acoes que mudam estado (POST/PUT/PATCH/DELETE) contam como "o que o usuario faz" —
// GET e so leitura/polling (ex.: connection page consultando status a cada 3s) e so
// afogaria o log em ruido sem ajudar a entender comportamento real.
const METHODS_TO_LOG = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SKIP_PREFIXES = ['/webhooks', '/api-docs'];

export function activityLogger(req: Request, res: Response, next: NextFunction) {
    if (!METHODS_TO_LOG.has(req.method) || SKIP_PREFIXES.some((p) => req.path.startsWith(p))) {
        return next();
    }

    const startedAt = Date.now();
    let capturedResponseBody: any;

    const originalJson = res.json.bind(res);
    res.json = ((body: any) => {
        capturedResponseBody = body;
        return originalJson(body);
    }) as typeof res.json;

    res.on('finish', () => {
        logRawActivity({
            userId: (req as any).user?.id ?? null,
            method: req.method,
            path: req.originalUrl.split('?')[0],
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            requestBody: req.body,
            responseBody: capturedResponseBody,
        });
    });

    next();
}
