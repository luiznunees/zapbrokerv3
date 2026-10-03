// Depois de um deploy, os arquivos JS da versão anterior somem do servidor. Quem ficou com
// a página aberta (no iPhone o app instalado fica dias vivo em segundo plano) pede um
// arquivo que não existe mais e quebra com "Failed to load chunk". A saída é recarregar
// a página uma vez, que já vem da versão nova.

const CHUNK_ERROR_PATTERN = /Failed to load chunk|Loading chunk [\w-]+ failed|ChunkLoadError|Importing a module script failed|Failed to fetch dynamically imported module/i
const LAST_RELOAD_KEY = 'zb:chunk-reload-at'
// Se recarregou há menos disso e o erro voltou, o problema não é versão velha — não entra em loop.
const MIN_INTERVAL_MS = 30_000

export function isChunkLoadError(error: unknown): boolean {
    const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
    return CHUNK_ERROR_PATTERN.test(message)
}

// Recarrega se for erro de versão velha. Devolve true quando recarregou.
export function reloadOnChunkError(error: unknown): boolean {
    if (typeof window === 'undefined' || !isChunkLoadError(error)) return false
    try {
        const last = Number(sessionStorage.getItem(LAST_RELOAD_KEY) || 0)
        if (Date.now() - last < MIN_INTERVAL_MS) return false
        sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()))
    } catch {
        // sessionStorage bloqueado: recarrega mesmo assim, uma vez por página
    }
    window.location.reload()
    return true
}
