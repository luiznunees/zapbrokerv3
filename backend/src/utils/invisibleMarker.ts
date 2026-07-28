// Caracteres Unicode invisíveis (largura zero) — não alteram o texto visível
// no WhatsApp, mas fazem cada mensagem enviada ter bytes diferentes das outras.
// Isso reduz o risco de banimento por "conteúdo idêntico em massa", já que o
// WhatsApp usa hash/similaridade de conteúdo pra detectar spam em disparos.
const INVISIBLE_CHARS = ['​', '‌', '‍', '⁠'];

function randomInvisibleSequence(): string {
    const length = 1 + Math.floor(Math.random() * 2); // 1 ou 2 caracteres
    let out = '';
    for (let i = 0; i < length; i++) {
        out += INVISIBLE_CHARS[Math.floor(Math.random() * INVISIBLE_CHARS.length)];
    }
    return out;
}

// Insere a sequência invisível numa posição pseudo-aleatória entre palavras
// (não sempre no fim) pra evitar um padrão fixo e detectável.
export function injectInvisibleMarker(text: string): string {
    if (!text) return text;

    const words = text.split(' ');
    if (words.length <= 1) return text + randomInvisibleSequence();

    const insertAt = 1 + Math.floor(Math.random() * (words.length - 1));
    words[insertAt] = randomInvisibleSequence() + words[insertAt];

    return words.join(' ');
}
