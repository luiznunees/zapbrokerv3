// Preço aproximado por 1M de tokens (USD), pago aos provedores de IA.
// Atualizar manualmente quando os provedores mudarem preço — não há API de preço em tempo real.
// cacheReadPer1M / cacheWritePer1M: prompt caching da Anthropic (leitura 0,1x e escrita 1,25x
// do input, TTL de 5min).
export const AI_PRICING: Record<string, { inputPer1M: number; outputPer1M: number; cacheReadPer1M: number; cacheWritePer1M: number }> = {
    'anthropic/claude-haiku-4.5': { inputPer1M: 1.00, outputPer1M: 5.00, cacheReadPer1M: 0.10, cacheWritePer1M: 1.25 }, // OpenRouter (único)
};

// Cotação aproximada USD -> BRL, só pra dar noção de custo em real no admin.
// Não é uma fonte de câmbio em tempo real — ajustar manualmente de vez em quando.
export const USD_TO_BRL = 5.4;

// inputTokens é o total do prompt (o OpenRouter já inclui os tokens lidos e escritos em
// cache nesse número) — por isso eles são descontados antes de cobrar o preço cheio.
export function estimateCostUsd(
    model: string,
    inputTokens: number,
    outputTokens: number,
    cachedTokens: number = 0,
    cacheWriteTokens: number = 0
): number {
    const pricing = AI_PRICING[model];
    if (!pricing) return 0;
    const uncachedInput = Math.max(0, inputTokens - cachedTokens - cacheWriteTokens);
    return (
        (uncachedInput / 1_000_000) * pricing.inputPer1M +
        (cachedTokens / 1_000_000) * pricing.cacheReadPer1M +
        (cacheWriteTokens / 1_000_000) * pricing.cacheWritePer1M +
        (outputTokens / 1_000_000) * pricing.outputPer1M
    );
}
