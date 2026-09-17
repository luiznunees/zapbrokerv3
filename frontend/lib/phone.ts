// Máscara pras caixas onde se digita um número de WhatsApp completo (conectar instância,
// código de pareamento, adicionar contato manualmente). O DDI (+55) é sempre fixo e
// automático — o usuário só digita DDD + número — então não tem como esquecer/errar o
// DDI, e se ele digitar "55" no começo por hábito, a gente detecta e tira o duplicado.

// Extrai só o DDD + número (sem DDI), a partir de qualquer coisa que o usuário digitar.
export function extractLocalPhoneDigits(raw: string): string {
    let digits = raw.replace(/\D/g, "")
    // Ex: usuário digitou "5511999998888" (com DDI) — sobrando DDD+número plausível
    // depois de tirar o 55, então o 55 é redundante (a gente já mostra fixo).
    if (digits.startsWith("55") && digits.length > 11) {
        digits = digits.slice(2)
    }
    return digits.slice(0, 11) // DDD (2) + número (até 9)
}

// Formata DDD+número pra exibição: (11) 91234-5678
export function formatLocalPhoneDisplay(localDigits: string): string {
    if (!localDigits) return ""
    const ddd = localDigits.slice(0, 2)
    const rest = localDigits.slice(2)

    let out = `(${ddd}${ddd.length === 2 ? ")" : ""}`
    if (rest) {
        // Celular (9 dígitos): 5+4. Fixo (8 dígitos): 4+4. Enquanto digita, some com o resto.
        const splitAt = rest.length > 8 ? rest.length - 4 : Math.min(4, rest.length)
        out += rest.length > splitAt ? ` ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}` : ` ${rest}`
    }
    return out
}

// O valor real (DDI + DDD + número, só dígitos) pra mandar pra API.
export function toFullPhoneDigits(localDigits: string): string {
    return localDigits ? "55" + localDigits : ""
}
