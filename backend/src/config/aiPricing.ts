// Preço aproximado por 1M de tokens (USD), pago aos provedores de IA.
// Atualizar manualmente quando os provedores mudarem preço — não há API de preço em tempo real.
export const AI_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
    'anthropic/claude-haiku-4.5': { inputPer1M: 1.00, outputPer1M: 5.00 }, // OpenRouter (principal)
    'llama-3.3-70b-versatile': { inputPer1M: 0.59, outputPer1M: 0.79 }, // Groq (fallback)
    'gemini-2.5-flash-lite': { inputPer1M: 0.10, outputPer1M: 0.40 }, // Gemini (fallback)
};

// Cotação aproximada USD -> BRL, só pra dar noção de custo em real no admin.
// Não é uma fonte de câmbio em tempo real — ajustar manualmente de vez em quando.
export const USD_TO_BRL = 5.4;

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = AI_PRICING[model];
    if (!pricing) return 0;
    return (inputTokens / 1_000_000) * pricing.inputPer1M + (outputTokens / 1_000_000) * pricing.outputPer1M;
}
