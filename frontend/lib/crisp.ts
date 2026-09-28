// Chat ao vivo (Crisp). O script é carregado uma vez pelo <CrispWidget /> no layout raiz;
// aqui ficam só os atalhos pra conversar com ele de qualquer lugar do app.
// Sem NEXT_PUBLIC_CRISP_WEBSITE_ID configurado, tudo aqui vira no-op.
//
// O $crisp é uma fila: dá pra dar push antes do script terminar de carregar, ele processa
// tudo quando ficar pronto — por isso nada aqui precisa esperar evento de "ready".

export const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID || ''
export const isCrispEnabled = Boolean(CRISP_WEBSITE_ID)

declare global {
    interface Window {
        $crisp?: unknown[][]
        CRISP_WEBSITE_ID?: string
        CRISP_RUNTIME_CONFIG?: Record<string, unknown>
    }
}

export function crispPush(...commands: unknown[][]) {
    if (typeof window === 'undefined' || !isCrispEnabled) return
    window.$crisp = window.$crisp || []
    for (const cmd of commands) window.$crisp.push(cmd)
}

// No dashboard a bolha fica escondida (o SupportButton ocupa o mesmo canto), então abrir
// precisa mostrar antes — e o CrispWidget volta a esconder quando o corretor fecha.
export function openCrisp() {
    crispPush(['do', 'chat:show'], ['do', 'chat:open'])
}

// Chamado no logout — sem isso o próximo corretor no mesmo navegador herdava a conversa.
export function resetCrisp() {
    crispPush(['do', 'session:reset'])
}
