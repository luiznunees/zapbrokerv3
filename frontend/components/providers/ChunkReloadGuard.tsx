"use client"

import { useEffect } from 'react'
import { reloadOnChunkError } from '@/lib/chunkReload'

// Pega erros de "arquivo da versão antiga" que ninguém tratou (import dinâmico, troca de
// rota) e recarrega a página na versão nova, em vez de deixar a tela quebrada.
export function ChunkReloadGuard() {
    useEffect(() => {
        const onRejection = (event: PromiseRejectionEvent) => reloadOnChunkError(event.reason)
        const onError = (event: ErrorEvent) => reloadOnChunkError(event.error ?? event.message)
        window.addEventListener('unhandledrejection', onRejection)
        window.addEventListener('error', onError)
        return () => {
            window.removeEventListener('unhandledrejection', onRejection)
            window.removeEventListener('error', onError)
        }
    }, [])

    return null
}
